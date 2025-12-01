"use client"

import { useEffect } from "react"

interface DynamicThemeStylesProps {
  settings: {
    primary_color_light?: string
    primary_color_dark?: string
    background_color_light?: string
    background_color_dark?: string
    card_color_light?: string
    card_color_dark?: string
    text_color_light?: string
    text_color_dark?: string
    accent_color_light?: string
    accent_color_dark?: string
    border_radius?: string
    custom_css?: string
  }
}

/**
 * DynamicThemeStyles - Injects custom theme colors and CSS dynamically
 * Uses DOM manipulation instead of styled-jsx to avoid nested tag errors
 */
export function DynamicThemeStyles({ settings }: DynamicThemeStylesProps) {
  useEffect(() => {
    // Set CSS custom properties on root element
    const root = document.documentElement

    if (settings.primary_color_light) {
      root.style.setProperty("--color-primary-light", settings.primary_color_light)
    }
    if (settings.primary_color_dark) {
      root.style.setProperty("--color-primary-dark", settings.primary_color_dark)
    }
    if (settings.background_color_light) {
      root.style.setProperty("--color-background-light", settings.background_color_light)
    }
    if (settings.background_color_dark) {
      root.style.setProperty("--color-background-dark", settings.background_color_dark)
    }
    if (settings.card_color_light) {
      root.style.setProperty("--color-card-light", settings.card_color_light)
    }
    if (settings.card_color_dark) {
      root.style.setProperty("--color-card-dark", settings.card_color_dark)
    }
    if (settings.text_color_light) {
      root.style.setProperty("--color-text-light", settings.text_color_light)
    }
    if (settings.text_color_dark) {
      root.style.setProperty("--color-text-dark", settings.text_color_dark)
    }
    if (settings.accent_color_light) {
      root.style.setProperty("--color-accent-light", settings.accent_color_light)
    }
    if (settings.accent_color_dark) {
      root.style.setProperty("--color-accent-dark", settings.accent_color_dark)
    }
    if (settings.border_radius) {
      root.style.setProperty("--radius", settings.border_radius)
    }

    const themeStyleId = "dynamic-theme-styles"
    let themeStyleElement = document.getElementById(themeStyleId) as HTMLStyleElement

    if (!themeStyleElement) {
      themeStyleElement = document.createElement("style")
      themeStyleElement.id = themeStyleId
      document.head.appendChild(themeStyleElement)
    }

    themeStyleElement.textContent = `
      :root {
        --primary: var(--color-primary-light, oklch(0.55 0.15 75));
        --background: var(--color-background-light, oklch(0.97 0.01 85));
        --card: var(--color-card-light, oklch(0.98 0.01 85));
        --foreground: var(--color-text-light, oklch(0.2 0 0));
        --accent: var(--color-accent-light, oklch(0.55 0.15 75));
      }

      .dark {
        --primary: var(--color-primary-dark, oklch(0.55 0.15 75));
        --background: var(--color-background-dark, oklch(0.24 0.04 175));
        --card: var(--color-card-dark, oklch(0.26 0.04 175));
        --foreground: var(--color-text-dark, oklch(0.95 0 0));
        --accent: var(--color-accent-dark, oklch(0.55 0.15 75));
      }
    `

    if (settings.custom_css) {
      const customStyleId = "custom-theme-styles"
      let customStyleElement = document.getElementById(customStyleId) as HTMLStyleElement

      if (!customStyleElement) {
        customStyleElement = document.createElement("style")
        customStyleElement.id = customStyleId
        document.head.appendChild(customStyleElement)
      }

      customStyleElement.textContent = settings.custom_css
    }

    // Cleanup function
    return () => {
      const themeStyle = document.getElementById(themeStyleId)
      const customStyle = document.getElementById("custom-theme-styles")
      if (themeStyle) themeStyle.remove()
      if (customStyle) customStyle.remove()
    }
  }, [settings])

  return null
}
