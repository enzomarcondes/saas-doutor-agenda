import { cn } from "@/lib/utils";

type PageContainerProps = React.ComponentProps<"div">;
type PageHeaderProps = React.ComponentProps<"div">;
type PageHeaderContentProps = React.ComponentProps<"div">;
type PageTitleProps = React.ComponentProps<"h1">;
type PageDescriptionProps = React.ComponentProps<"p">;
type PageActionsProps = React.ComponentProps<"div">;
type PageContentProps = React.ComponentProps<"div">;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn("flex min-h-screen flex-col gap-8 p-8", className)}
      {...props}
    />
  );
}

export function PageHeader({ className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b pb-4",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeaderContent({
  className,
  ...props
}: PageHeaderContentProps) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function PageTitle({ className, ...props }: PageTitleProps) {
  return (
    <h1
      className={cn("text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function PageDescription({ className, ...props }: PageDescriptionProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

export function PageActions({ className, ...props }: PageActionsProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} {...props} />
  );
}

export function PageContent({ className, ...props }: PageContentProps) {
  return <div className={cn("flex-1", className)} {...props} />;
}
