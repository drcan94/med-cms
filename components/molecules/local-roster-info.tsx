"use client"

import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type LocalRosterInfoProps = {
  className?: string
  message: string
}

export function LocalRosterInfo({
  className,
  message,
}: Readonly<LocalRosterInfoProps>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "size-6 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
            className
          )}
          aria-label={message}
          title={message}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <CircleAlert className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 rounded-2xl text-sm leading-6 text-muted-foreground"
      >
        {message}
      </PopoverContent>
    </Popover>
  )
}
