'use client'

import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useToast } from './ui/use-toast'
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`
import { useResizeDetector } from 'react-resize-detector'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu'
import SimpleBar from 'simplebar-react'
import PdfFullScreen from './PdfFullScreen'

interface PdfRendererProps {
    url: string
}

/**
 * Renders a PDF document based on the provided URL.
 *
 * @param {string} url - The URL of the PDF file to render
 * @return {JSX.Element} The rendered PDF document component
 */
const PdfRenderer = ({ url }: PdfRendererProps): JSX.Element => {
    const { toast } = useToast()

    const [numPages, setNumPages] = useState<number>()
    const [currPage, setCurrPage] = useState<number>(1)
    const [scale, setScale] = useState<number>(1)
    const [rotation, setRotation] = useState<number>(0)
    const [renderedScale, setRenderedScale] = useState<number | null>(null)

    const isLoading = renderedScale !== scale

    const customPageValidator = z.object({
        page: z
            .string()
            .refine((num) => Number(num) > 0 && Number(num) <= numPages!)
    })

    type TCustomPageValidator = z.infer<typeof customPageValidator>

    const {
        register,
        formState: { errors },
        handleSubmit,
        setValue
    } = useForm<TCustomPageValidator>({
        defaultValues: {
            page: '1'
        },
        resolver: zodResolver(customPageValidator)
    })

    const { width, ref } = useResizeDetector()

    /**
     * Updates the current page number and sets the value for the page.
     *
     * @param {TCustomPageValidator} page - The page object containing the page number
     * @return {void} No return value
     */
    const handlePageSubmit = ({ page }: TCustomPageValidator) => {
        setCurrPage(Number(page))
    }

    useEffect(() => {
        setValue('page', String(currPage))
    }, [currPage, setValue])

    return (
        <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
            <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        aria-label="Previous Page"
                        disabled={currPage <= 1}
                        onClick={() =>
                            setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
                        }
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1.5">
                        <Input
                            {...register('page')}
                            className={cn(
                                'w-12 h-8',
                                errors.page && 'focus-visible:ring-red-500'
                            )}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleSubmit(handlePageSubmit)()
                                }
                            }}
                        />
                        <p className="text-zinc-700 text-sm space-x-1">
                            <span>/</span>
                            <span>{numPages ?? 'x'}</span>
                        </p>
                    </div>

                    <Button
                        disabled={
                            numPages === undefined || currPage === numPages
                        }
                        variant="ghost"
                        aria-label="Next Page"
                        onClick={() =>
                            setCurrPage((prev) =>
                                prev + 1 > numPages! ? numPages! : prev + 1
                            )
                        }
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="gap-1.5"
                                aria-label="zoom"
                                variant="ghost"
                            >
                                <Search className="h-4 w-4" />
                                {scale * 100}%
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setScale(1)}>
                                100%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(1.5)}>
                                150%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(2)}>
                                200%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(2.5)}>
                                250%
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        aria-label="rotate 90 degress"
                        onClick={() => setRotation((prev) => prev + 90)}
                        variant="ghost"
                    >
                        <RotateCw className="h-4 w-4" />
                    </Button>

                    <PdfFullScreen fileUrl={url} />
                </div>
            </div>

            <div className="flex-1 w-full max-h-screen">
                <SimpleBar
                    autoHide={false}
                    className="max-h-[calc(100vh-10rem)]"
                >
                    <div ref={ref}>
                        <Document
                            loading={
                                <div className="flex justify-center">
                                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                </div>
                            }
                            onLoadError={() => {
                                toast({
                                    title: 'Error loading PDF',
                                    description: 'Please try again later',
                                    variant: 'destructive'
                                })
                            }}
                            onLoadSuccess={({ numPages }) =>
                                setNumPages(numPages)
                            }
                            file={url}
                            className="max-h-full"
                        >
                            {isLoading && renderedScale ? (
                                <Page
                                    width={width ? width : 1}
                                    pageNumber={currPage}
                                    scale={scale}
                                    rotate={rotation}
                                />
                            ) : null}

                            <Page
                                className={cn(isLoading ? 'hidden' : '')}
                                width={width ? width : 1}
                                pageNumber={currPage}
                                scale={scale}
                                rotate={rotation}
                                loading={
                                    <div className="flex justify-center">
                                        <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                    </div>
                                }
                                onRenderSuccess={() => {
                                    setRenderedScale(scale)
                                }}
                            />
                        </Document>
                    </div>
                </SimpleBar>
            </div>
        </div>
    )
}

export default PdfRenderer
