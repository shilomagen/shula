import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { ImageMessageMedia } from '@shula/shared-queues';
import axios from 'axios';
import sharp from 'sharp';
import { BoundingBox } from '../interfaces/face-recognition.interfaces';

/**
 * Service for image processing operations
 */
@Injectable()
export class ImageUtilsService {
  private readonly logger = new ContextLogger(ImageUtilsService.name);

  /**
   * Get image buffer from either URL, base64 string, or ImageMessageMedia object
   * @param imageData The image data (URL, base64, or ImageMessageMedia)
   * @returns Buffer containing the image data
   */
  public async getImageBuffer(
    imageData: string | ImageMessageMedia
  ): Promise<Buffer> {
    // If imageData is an ImageMessageMedia object
    if (typeof imageData !== 'string') {
      // Use base64Data if available
      if (imageData.base64Data) {
        this.logger.debug('Using base64 data from ImageMessageMedia');
        return Buffer.from(imageData.base64Data, 'base64');
      }
      // Fall back to mediaUrl if available
      if (imageData.mediaUrl) {
        this.logger.debug(`Downloading image from URL in ImageMessageMedia`);
        return this.downloadImageFromUrl(imageData.mediaUrl);
      }
      throw new Error('No image data available in ImageMessageMedia');
    }

    // If imageData is a string, it could be a URL or base64 data
    if (imageData.startsWith('http')) {
      // It's a URL
      this.logger.debug(`Downloading image from URL: ${imageData}`);
      return this.downloadImageFromUrl(imageData);
    } else {
      // Assume it's base64 data
      this.logger.debug('Using provided base64 data');
      return Buffer.from(imageData, 'base64');
    }
  }

  /**
   * Download image from URL and return as buffer
   * @param url The URL to download from
   * @returns Buffer containing the image data
   */
  private async downloadImageFromUrl(url: string): Promise<Buffer> {
    const imageResponse = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(imageResponse.data);
  }

  /**
   * Clamps crop dimensions to fit within image bounds while preserving aspect ratio
   * @param dimensions - The original crop dimensions
   * @param imgWidth - The image width
   * @param imgHeight - The image height
   * @returns Adjusted crop dimensions that fit within the image bounds
   */
  private clampCropDimensions(
    dimensions: { left: number; top: number; width: number; height: number },
    imgWidth: number,
    imgHeight: number
  ): { left: number; top: number; width: number; height: number } {
    let { left, top, width, height } = dimensions;

    // Clamp left and width
    if (left < 0) {
      width += left; // Reduce width by the negative left amount
      left = 0;
    }
    if (left + width > imgWidth) {
      width = imgWidth - left;
    }

    // Clamp top and height
    if (top < 0) {
      height += top; // Reduce height by the negative top amount
      top = 0;
    }
    if (top + height > imgHeight) {
      height = imgHeight - top;
    }

    // Ensure minimum dimensions
    width = Math.max(width, 1);
    height = Math.max(height, 1);

    return { left, top, width, height };
  }

  /**
   * Crops a face from an image based on AWS BoundingBox
   * @param imageBytes - The original image bytes
   * @param boundingBox - The AWS bounding box of the face
   * @returns Buffer containing the cropped face image
   */
  public async cropFaceFromAwsBoundingBox(
    imageBytes: Buffer,
    boundingBox: {
      Width?: number;
      Height?: number;
      Left?: number;
      Top?: number;
    }
  ): Promise<Buffer> {
    try {
      if (
        boundingBox.Width === undefined ||
        boundingBox.Height === undefined ||
        boundingBox.Left === undefined ||
        boundingBox.Top === undefined
      ) {
        throw new Error('Invalid bounding box: missing required properties');
      }

      const image = sharp(imageBytes);
      const metadata = await image.metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      if (imgWidth === 0 || imgHeight === 0) {
        throw new Error('Could not determine image dimensions');
      }

      const left = Math.floor(boundingBox.Left * imgWidth);
      const top = Math.floor(boundingBox.Top * imgHeight);
      const width = Math.floor(boundingBox.Width * imgWidth);
      const height = Math.floor(boundingBox.Height * imgHeight);

      const clampedDimensions = this.clampCropDimensions(
        { left, top, width, height },
        imgWidth,
        imgHeight
      );

      // Crop the image using clamped dimensions
      return image.extract(clampedDimensions).toBuffer();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cropping face: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Crops a face from an image based on standard bounding box
   * @param imageBytes - The original image bytes
   * @param boundingBox - The standard bounding box of the face
   * @returns Buffer containing the cropped face image
   */
  public async cropFace(
    imageBytes: Buffer,
    boundingBox: BoundingBox
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBytes);
      const metadata = await image.metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      if (imgWidth === 0 || imgHeight === 0) {
        throw new Error('Could not determine image dimensions');
      }

      // Standard bounding box uses absolute coordinates
      const left = Math.floor(boundingBox.x);
      const top = Math.floor(boundingBox.y);
      const width = Math.floor(boundingBox.width);
      const height = Math.floor(boundingBox.height);

      const clampedDimensions = this.clampCropDimensions(
        { left, top, width, height },
        imgWidth,
        imgHeight
      );

      // Crop the image using clamped dimensions
      return image.extract(clampedDimensions).toBuffer();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cropping face: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Converts AWS BoundingBox to standard BoundingBox format
   * @param awsBoundingBox AWS BoundingBox with relative coordinates
   * @param imageWidth Width of the original image
   * @param imageHeight Height of the original image
   * @returns Standard BoundingBox with absolute coordinates
   */
  public convertAwsBoundingBoxToStandard(
    awsBoundingBox: {
      Width?: number;
      Height?: number;
      Left?: number;
      Top?: number;
    },
    imageWidth: number,
    imageHeight: number
  ): BoundingBox {
    if (
      awsBoundingBox.Width === undefined ||
      awsBoundingBox.Height === undefined ||
      awsBoundingBox.Left === undefined ||
      awsBoundingBox.Top === undefined
    ) {
      throw new Error('Invalid AWS bounding box: missing required properties');
    }

    return {
      x: Math.floor(awsBoundingBox.Left * imageWidth),
      y: Math.floor(awsBoundingBox.Top * imageHeight),
      width: Math.floor(awsBoundingBox.Width * imageWidth),
      height: Math.floor(awsBoundingBox.Height * imageHeight),
    };
  }
}
