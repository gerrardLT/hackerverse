"use client"

import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface FileUploadProps {
  onUpload: (files: File[]) => Promise<string[]>
  onError?: (error: string) => void
  multiple?: boolean
  maxSize?: number
  accept?: string
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onUpload,
  onError,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  accept = "image/*,.pdf,.txt,.json",
  className,
  disabled = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const t = useTranslations('ui.fileUpload')
  const tCommon = useTranslations('common')

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      await onUpload(files)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : t('uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">{t('title')}</p>
        <p className="text-sm text-muted-foreground mb-4">
          {t('supportedFormats')}
        </p>
        <Button
          disabled={disabled || isUploading}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isUploading ? t('uploading') : t('selectFiles')}
        </Button>
        <input
          id="file-input"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
} 