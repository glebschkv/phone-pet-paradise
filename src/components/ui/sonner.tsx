import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      style={{ '--offset': 'max(14px, env(safe-area-inset-top, 14px))' } as React.CSSProperties}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1c1412] group-[.toaster]:text-amber-100 group-[.toaster]:border group-[.toaster]:border-amber-500/30 group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/40 group-[.toaster]:rounded-lg group-[.toaster]:text-sm",
          title: "group-[.toast]:text-amber-200 group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-amber-100/70 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-amber-500/20 group-[.toast]:text-amber-300 group-[.toast]:border group-[.toast]:border-amber-500/40 group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-white/5 group-[.toast]:text-amber-100/60 group-[.toast]:text-xs",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-[#0f1a14]",
          error:
            "group-[.toaster]:border-red-500/30 group-[.toaster]:bg-[#1a0f0f]",
          warning:
            "group-[.toaster]:border-yellow-500/30 group-[.toaster]:bg-[#1a1710]",
          info:
            "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-[#0f141a]",
        },
      }}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast }
