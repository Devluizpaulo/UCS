
export function AppFooter() {
    return (
        <footer className="border-t bg-background/95 sticky bottom-0 z-30">
            <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} BMV Digital. Todos os direitos reservados.
                </p>
                <p className="text-sm text-muted-foreground">
                    Painel v0.0.1
                </p>
            </div>
        </footer>
    )
}
