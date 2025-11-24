import React from "react"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

interface AlertDialogTitleProps {
  children: React.ReactNode
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="max-w-lg w-full mx-4">
        {children}
      </div>
    </div>
  )
}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ children, className = "" }) => {
  return (
    <div className={`border bg-background p-6 shadow-lg rounded-lg ${className}`}>
      {children}
    </div>
  )
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ children }) => {
  return <div className="flex flex-col space-y-2 text-center sm:text-left">{children}</div>
}

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ children }) => {
  return <h2 className="text-lg font-semibold text-white">{children}</h2>
}

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ children }) => {
  return <p className="text-sm text-gray-300">{children}</p>
}

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ children, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ children, className = "", onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 border border-gray-600 ${className}`}
    >
      {children}
    </button>
  )
}