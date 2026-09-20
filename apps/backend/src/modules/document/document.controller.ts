import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async getDocuments(@Req() req: any, @Query('folder') folder?: string) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    return this.documentService.getDocuments(tenantId, folder);
  }

  @Get(':id')
  async getDocumentById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    return this.documentService.getDocumentById(tenantId, id);
  }

  @Post('presigned-upload')
  @HttpCode(HttpStatus.OK)
  async getPresignedUploadUrl(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      folder?: string;
      description?: string;
    },
  ) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    const userId = req.user?.id;
    return this.documentService.getPresignedUploadUrl(
      tenantId,
      body.title,
      body.fileName,
      body.mimeType,
      body.fileSize,
      body.folder,
      body.description,
      userId,
    );
  }

  @Get(':id/presigned-download')
  async getPresignedDownloadUrl(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    return this.documentService.getPresignedDownloadUrl(tenantId, id);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.OK)
  async uploadNewVersion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { fileName: string; fileSize: number; changeSummary?: string },
  ) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000002';
    return this.documentService.uploadNewVersion(
      tenantId,
      id,
      userId,
      body.fileName,
      body.fileSize,
      body.changeSummary,
    );
  }

  @Delete(':id')
  async deleteDocument(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
    return this.documentService.deleteDocument(tenantId, id);
  }
}
