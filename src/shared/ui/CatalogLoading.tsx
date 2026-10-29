export function CatalogLoading() {
    return (
        <div className="min-h-[60vh] w-full flex items-center justify-center bg-[#0A0F2C] px-6 py-24">
            <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
                <span className="h-10 w-10 rounded-full border-2 border-[#C9A84C]/25 border-t-[#C9A84C] animate-spin" />
                <span className="text-xs tracking-[0.35em] uppercase text-[#C9A84C]/80">
                    SADAF
                </span>
                <span className="sr-only">Loading catalog</span>
            </div>
        </div>
    );
}
