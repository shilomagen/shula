import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSystemMessageDto } from './dto/system-messages-create.dto';
import { RenderSystemMessageDto } from './dto/system-messages-render.dto';
import { SystemMessageResponseDto } from './dto/system-messages-response.dto';
import { UpdateSystemMessageDto } from './dto/system-messages-update.dto';
import { SystemMessagesService } from './system-messages.service';
import { SystemMessageTemplateResult } from './system-messages.types';

@ApiTags('system-messages')
@Controller('v1/system-messages')
export class SystemMessagesController {
  constructor(private readonly systemMessagesService: SystemMessagesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new system message',
    description: 'Creates a new system message with the provided data',
    operationId: 'createSystemMessage',
  })
  @ApiResponse({
    status: 201,
    description: 'The system message has been successfully created',
    type: SystemMessageResponseDto,
  })
  async createSystemMessage(
    @Body() dto: CreateSystemMessageDto
  ): Promise<SystemMessageResponseDto> {
    return this.systemMessagesService.createSystemMessage(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all system messages',
    description: 'Retrieves all active system messages',
    operationId: 'getAllSystemMessages',
  })
  @ApiResponse({
    status: 200,
    description: 'List of system messages',
    type: [SystemMessageResponseDto],
  })
  async getAllSystemMessages(): Promise<SystemMessageResponseDto[]> {
    return this.systemMessagesService.findAllSystemMessages();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a system message by ID',
    description: 'Retrieves a system message by its unique identifier',
    operationId: 'getSystemMessageById',
  })
  @ApiParam({
    name: 'id',
    description: 'System message ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'The system message',
    type: SystemMessageResponseDto,
  })
  async getSystemMessageById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<SystemMessageResponseDto> {
    return this.systemMessagesService.findSystemMessageById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a system message',
    description: 'Updates an existing system message with the provided data',
    operationId: 'updateSystemMessage',
  })
  @ApiParam({
    name: 'id',
    description: 'System message ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'The system message has been successfully updated',
    type: SystemMessageResponseDto,
  })
  async updateSystemMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSystemMessageDto
  ): Promise<SystemMessageResponseDto> {
    return await this.systemMessagesService.updateSystemMessage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a system message',
    description: 'Marks a system message as deleted',
    operationId: 'deleteSystemMessage',
  })
  @ApiParam({
    name: 'id',
    description: 'System message ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'The system message has been successfully deleted',
  })
  async deleteSystemMessage(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.systemMessagesService.deleteSystemMessage(id);
  }

  @Post('render')
  @ApiOperation({
    summary: 'Render a system message',
    description:
      'Renders a system message by replacing placeholders with provided parameters',
    operationId: 'renderSystemMessage',
  })
  @ApiResponse({
    status: 200,
    description: 'The rendered system message',
    type: SystemMessageResponseDto,
  })
  async renderSystemMessage(
    @Body() dto: RenderSystemMessageDto
  ): Promise<SystemMessageTemplateResult> {
    return this.systemMessagesService.renderSystemMessage(dto.key, dto.params);
  }
}
