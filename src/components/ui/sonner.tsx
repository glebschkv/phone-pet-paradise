import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      style={{
        // Use max() to ensure toasts clear the Dynamic Island even when
        // env(safe-area-inset-top) returns 0 inside WKWebView.
        '--offset': 'max(calc(env(safe-area-inset-top, 0px) + 8px), calc(var(--sat, 0px) + 8px), 54px)',
      } as React.CSSProperties}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#120a18]/95 group-[.toaster]:text-purple-100 group-[.toaster]:border group-[.toaster]:border-purple-500/25 group-[.toaster]:shadow-lg group-[.toaster]:shadow-purple-900/30 group-[.toaster]:rounded-xl group-[.toaster]:text-sm group-[.toaster]:backdrop-blur-md",
          title: "group-[.toast]:text-purple-100 group-[.toast]:font-medium group-[.toast]:text-sm",
          description: "group-[.toast]:text-purple-200/60 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-purple-500/20 group-[.toast]:text-purple-200 group-[.toast]:border group-[.toast]:border-purple-500/30 group-[.toast]:text-xs group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-white/5 group-[.toast]:text-purple-200/50 group-[.toast]:text-xs group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:border-emerald-500/25 group-[.toaster]:bg-[#0a1210]/95",
          error:
            "group-[.toaster]:border-red-500/25 group-[.toaster]:bg-[#150a0a]/95",
          warning:
            "group-[.toaster]:border-amber-500/25 group-[.toaster]:bg-[#151008]/95",
          info:
            "group-[.toaster]:border-blue-400/25 group-[.toaster]:bg-[#0a0e15]/95",
        },
      }}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast }
