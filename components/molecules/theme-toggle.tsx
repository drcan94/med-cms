"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ThemeOption = "light" | "dark" | "system"

type ThemeConfig = {
  icon: LucideIcon
  translationKey: ThemeOption
  value: ThemeOption
}

const THEME_OPTIONS: ThemeConfig[] = [
  {
    value: "light",
    translationKey: "light",
    icon: SunMedium,
  },
  {
    value: "dark",
    translationKey: "dark",
    icon: MoonStar,
  },
  {
    value: "system",
    translationKey: "system",
    icon: LaptopMinimal,
  },
]

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: Readonly<ThemeToggleProps>) {
  const t = useTranslations("ThemeToggle")
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = (mounted ? theme : "system") ?? "system"
  const activeOption =
    THEME_OPTIONS.find((option) => option.value === activeTheme) ??
    THEME_OPTIONS[2]
  const ActiveIcon = activeOption.icon
  const activeLabel = t(`options.${activeOption.translationKey}.label`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "border-border/70 bg-background/90 shadow-sm backdrop-blur-sm",
            className
          )}
          aria-label={t("ariaLabel", { theme: activeLabel })}
        >
          <ActiveIcon className="size-4" />
          <span className="sr-only">{t("srOnly")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("appearance")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={activeTheme}
          onValueChange={(value) => setTheme(value)}
        >
          {THEME_OPTIONS.map(({ icon: Icon, translationKey, value }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="items-start gap-3 py-2"
            >
              <Icon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {t(`options.${translationKey}.label`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`options.${translationKey}.description`)}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
