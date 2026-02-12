import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      // Toast offset is handled via CSS rule in index.css targeting
      // [data-sonner-toaster][data-y-position='top'] to clear the Dynamic Island.
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a0f24]/95 group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-purple-400/30 group-[.toaster]:shadow-[0_4px_20px_rgba(147,51,234,0.25)] group-[.toaster]:rounded-2xl group-[.toaster]:text-sm group-[.toaster]:backdrop-blur-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:text-sm group-[.toast]:tracking-wide",
          description: "group-[.toast]:text-purple-100/70 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-purple-500/30 group-[.toast]:text-purple-100 group-[.toast]:border group-[.toast]:border-purple-400/40 group-[.toast]:text-xs group-[.toast]:rounded-lg group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-purple-200/60 group-[.toast]:text-xs group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:border-emerald-400/40 group-[.toaster]:bg-[#0d1a14]/95 group-[.toaster]:shadow-[0_4px_20px_rgba(52,211,153,0.2)]",
          error:
            "group-[.toaster]:border-red-400/40 group-[.toaster]:bg-[#1a0d0d]/95 group-[.toaster]:shadow-[0_4px_20px_rgba(248,113,113,0.2)]",
          warning:
            "group-[.toaster]:border-amber-400/40 group-[.toaster]:bg-[#1a1508]/95 group-[.toaster]:shadow-[0_4px_20px_rgba(251,191,36,0.2)]",
          info:
            "group-[.toaster]:border-blue-400/40 group-[.toaster]:bg-[#0d1220]/95 group-[.toaster]:shadow-[0_4px_20px_rgba(96,165,250,0.2)]",
        },
      }}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast }
