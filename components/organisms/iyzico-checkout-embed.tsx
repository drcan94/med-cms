"use client"

import { useEffect, useRef } from "react"

type IyzicoCheckoutEmbedProps = {
  checkoutFormContent: string
}

export function IyzicoCheckoutEmbed({
  checkoutFormContent,
}: Readonly<IyzicoCheckoutEmbedProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.innerHTML = checkoutFormContent

    for (const script of Array.from(container.querySelectorAll("script"))) {
      const executableScript = document.createElement("script")

      for (const attribute of Array.from(script.attributes)) {
        executableScript.setAttribute(attribute.name, attribute.value)
      }

      executableScript.text = script.text
      script.replaceWith(executableScript)
    }

    return () => {
      container.innerHTML = ""
    }
  }, [checkoutFormContent])

  return <div ref={containerRef} className="min-h-24" />
}
