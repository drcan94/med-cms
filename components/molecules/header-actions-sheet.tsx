"use client"

import { EllipsisVertical } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/molecules/language-switcher"
import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type HeaderActionsSheetProps = {
  className?: string
}

export function HeaderActionsSheet({
  className,
}: Readonly<HeaderActionsSheetProps>) {
  const t = useTranslations("Header")
  const languageT = useTranslations("LanguageSwitcher")

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "border-border/70 bg-background/90 shadow-sm backdrop-blur-sm",
            className
          )}
          aria-label={t("openActions")}
        >
          <EllipsisVertical className="size-4" />
          <span className="sr-only">{t("openActions")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("subtitle")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3">
            <p className="text-sm font-medium">{languageT("label")}</p>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3">
            <p className="text-sm font-medium">{t("themeLabel")}</p>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
