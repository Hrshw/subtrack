import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    loading = false
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] bg-[#0a0e17] border-white/10 text-white z-[120]">
                <DialogHeader>
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 animate-in zoom-in",
                        variant === 'danger' ? "bg-red-500/20 text-red-500" :
                            variant === 'warning' ? "bg-amber-500/20 text-amber-500" :
                                "bg-emerald-500/20 text-emerald-500"
                    )}>
                        {variant === 'danger' ? <Trash2 className="w-6 h-6" /> :
                            variant === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                                <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-slate-400 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-8 flex gap-3 sm:space-x-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-11"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "flex-1 h-11 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]",
                            variant === 'danger' ? "bg-red-600 hover:bg-red-700 text-white" :
                                variant === 'warning' ? "bg-amber-600 hover:bg-amber-700 text-white" :
                                    "bg-emerald-500 hover:bg-emerald-600 text-white"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;
