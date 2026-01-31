"use client"

import { useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("ai-ustad-theme") as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("ai-ustad-theme", newTheme)

    const root = document.documentElement
    root.setAttribute("data-theme", newTheme)

    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      // system theme
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  return { theme, setTheme, mounted }
}
