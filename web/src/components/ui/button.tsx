import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
const styles = cva('inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50', { variants: { variant: { default:'bg-teal-700 text-white hover:bg-teal-800', outline:'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800', ghost:'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800' } }, defaultVariants: { variant:'default' } })
type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>
export function Button({ className,variant,...props }:Props) { return <button className={cn(styles({variant}),className)} {...props}/> }
