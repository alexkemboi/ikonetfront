"use client"

import { Button } from "@/components/ui/button"

interface DataTableFilterPillProps extends React.ComponentProps<typeof Button> {
 active?: boolean
}

export function DataTableFilterPill({
 active = false,
 variant,
 size = "xs",
 className,
 ...props
}: DataTableFilterPillProps) {
 return (
 <Button
 type="button"
 variant={variant ?? (active ? "default" : "secondary")}
 size={size}
 className={className}
 {...props}
 />
 )
}
