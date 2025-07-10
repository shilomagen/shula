# Shula - Face Recognition System

## Overview

The face recognition system is a critical component of Shula, responsible for identifying individuals in photos shared in WhatsApp groups and enabling targeted distribution to the appropriate participants. This document outlines the approach, technical implementation considerations, and potential solutions for the face recognition system.

## Technical Approaches

### 1. Self-Hosted Solutions

#### TensorFlow.js / TensorFlow

- **Pros:**
  - Full control over the implementation
  - No recurring API costs
  - Can work offline/on-premise
  - Open-source with large community

- **Cons:**
  - Higher implementation complexity
  - Requires expertise in machine learning
  - Needs GPU resources for optimal performance
  - May require more tuning and maintenance

- **Implementation Path:**
  - Use pre-trained models like FaceNet or MobileNet
  - Implement face detection using MTCNN or BlazeFace
  - Extract face embeddings from detected faces
  - Use similarity metrics for matching

#### face-api.js / face-recognition.js

- **Pros:**
  - JavaScript-based, easier integration with Node.js
  - Simpler API than raw TensorFlow
  - Includes ready-to-use face detection and recognition

- **Cons:**
  - May have performance limitations
  - Less flexible than direct TensorFlow
  - Smaller community and support

- **Implementation Path:**
  - Use face-api.js for both detection and recognition
  - Implement custom storage of face descriptors
  - Create matching logic with configurable thresholds

### 2. Cloud-Based Solutions

#### AWS Rekognition

- **Pros:**
  - Fully managed service
  - High accuracy and reliability
  - Scales well with demand
  - Simple API integration

- **Cons:**
  - Usage-based pricing can be expensive at scale
  - Limited control over the algorithms
  - Requires internet connectivity
  - Data privacy considerations

- **Implementation Path:**
  - Use CreateCollection API to create face collections per group
  - IndexFaces API to store participant faces
  - SearchFacesByImage for matching in new photos
  - Implement local caching to reduce API calls

#### Google Cloud Vision

- **Pros:**
  - High-quality face detection
  - Integration with other Google Cloud services
  - Regular updates and improvements

- **Cons:**
  - Face recognition requires separate implementation
  - Usage-based pricing
  - Less specialized for face recognition than alternatives

- **Implementation Path:**
  - Use Vision API for face detection
  - Implement custom feature extraction and matching
  - Consider using in combination with TensorFlow

#### Azure Face API

- **Pros:**
  - Comprehensive face recognition capabilities
  - Group-based face organization (Person Groups)
  - Good documentation and support
  - Competitive pricing for smaller scales

- **Cons:**
  - Usage-based pricing
  - Data privacy considerations
  - Requires internet connectivity

- **Implementation Path:**
  - Create PersonGroup for each WhatsApp group
  - Add Person for each individual to be recognized
  - Register Face for each person
  - Use Identify to match faces in new photos

## Recommended Approach

### Hybrid Solution

A hybrid approach combining local face detection with cloud-based recognition offers a good balance of performance, cost, and accuracy:

1. **Local Face Detection:**
   - Use BlazeFace or MTCNN via TensorFlow.js to detect faces locally
   - Extract and normalize face regions from photos
   - Reduces cloud API costs by filtering out photos without faces
   - Provides bounding box information for UI/feedback

2. **Cloud Recognition:**
   - Send detected face regions to AWS Rekognition or Azure Face
   - Leverage cloud accuracy for the recognition task
   - Cache results to minimize API calls
   - Implement fallback mechanisms for service disruptions

3. **Progressive Enhancement:**
   - Start with cloud solution for faster time-to-market
   - Gradually implement local recognition as a fallback
   - Transition to full local processing for cost optimization when viable

This hybrid approach allows for:
- Faster initial implementation with cloud services
- Cost control by reducing API calls through local preprocessing
- Path to full local processing for privacy and cost benefits

### Implementation in Shula (AWS Rekognition)

Shula currently uses **AWS Rekognition** for the recognition step. Each person registered in the system maps to a Rekognition **User**. Training photos are uploaded to a temporary S3 bucket and removed once indexing completes.

1. Faces are detected in each training image and cropped using `ImageUtilsService.cropFaceFromAwsBoundingBox`.
2. The cropped faces are indexed with `indexFaces` and then associated to a user via `createUserWithFaces` (the user id matches the person id).
3. When a new group photo is processed, every detected face is cropped and passed to `searchUsersByImage` which returns matching users.
4. After indexing a person's photos, the original images are deleted from the S3 bucket, ensuring we only keep the minimal metadata in the database and on Rekognition.

Deletion requests trigger `PersonSideEffectsFlowService` which removes the Rekognition user and faces before deleting the database record.

## Face Recognition Workflow

### Training Phase

1. **Registration:**
   - Parent registers child for recognition
   - Parent provides multiple photos of the child
   - System prompts for photos showing different angles/expressions

2. **Face Detection:**
   - System detects faces in each training photo
   - Validates face quality (size, clarity, lighting)
   - Rejects poor-quality images with feedback

3. **Feature Extraction:**
   - Extracts facial features from each valid face
   - Generates feature vectors/embeddings
   - Stores embeddings with metadata in database

4. **Model Training:**
   - If using custom model, updates the model with new face data
   - If using cloud service, indexes faces in the service

### Recognition Phase

1. **Image Ingestion:**
   - New photo is shared in WhatsApp group
   - WhatsApp Container downloads and queues the image
   - Image is sent to Backend for processing

2. **Face Detection:**
   - System detects all faces in the image
   - Filters faces below quality threshold
   - Extracts and normalizes face regions

3. **Feature Extraction:**
   - Extracts feature vectors from each detected face
   - Prepares vectors for comparison

4. **Matching:**
   - Compares extracted features against stored features
   - Calculates similarity scores for each comparison
   - Identifies best matches above confidence threshold

5. **Result Processing:**
   - Associates matched faces with registered persons
   - Links persons to participants (parents)
   - Records matches in database with confidence scores

6. **Distribution:**
   - Generates list of participants who should receive the photo
   - Queues photo for delivery to each matching participant
   - WhatsApp Container sends private messages with the photo

## Performance Considerations

### Efficiency

- **Batch Processing:** Process multiple photos in parallel
- **Downsampling:** Resize images to appropriate resolution before processing
- **Face Cropping:** Only process the face regions, not entire images
- **Caching:** Cache feature vectors and interim results

### Accuracy

- **Multiple Training Images:** Require multiple photos per person for better coverage
- **Quality Assessment:** Implement quality scoring for both training and test images
- **Threshold Tuning:** Carefully calibrate match confidence thresholds
- **Regular Retraining:** Update face data periodically as children grow
- **Feedback Loop:** Allow users to report incorrect matches to improve the system

### Scalability

- **Queue-Based Processing:** Use BullMQ for controlled asynchronous processing
- **Horizontal Scaling:** Design for multiple workers processing the queue
- **Resource Management:** Monitor and limit CPU/GPU usage per process
- **Rate Limiting:** Implement rate limits for cloud API calls
- **Load Shedding:** Design graceful degradation under heavy load

## Privacy and Ethical Considerations

- **Data Protection:** Encrypt all facial feature data at rest
- **Minimal Storage:** Only store feature vectors, not the face images themselves
- **Clear Consent:** Ensure clear opt-in from all participants
- **Age Considerations:** Implement special safeguards for children's data
- **Data Deletion:** Provide straightforward process to delete facial data
- **Transparency:** Clearly communicate how facial data is used
- **Access Control:** Strictly limit access to facial recognition data

## Conclusion

The face recognition system is central to Shula's value proposition. A hybrid approach that combines the best of local processing and cloud services provides a balanced solution that can evolve with the project's needs. Careful attention to privacy, data protection, and user consent is essential, especially when dealing with images of children. 