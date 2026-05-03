import { GripVertical, GripHorizontal } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

type GroupProps = React.ComponentProps<typeof Group>;
type PanelProps = React.ComponentProps<typeof Panel>;
type SepProps = React.ComponentProps<typeof Separator> & {
  orientation?: "horizontal" | "vertical";
};

const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
  <Group
    className={cn(
      "flex h-full w-full data-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = (props: PanelProps) => <Panel {...props} />;

const ResizableHandle = ({
  className,
  orientation = "horizontal",
  ...props
}: SepProps) => {
  const isVertical = orientation === "vertical";
  return (
    <Separator
      className={cn(
        "group relative flex items-center justify-center bg-border/60 transition-colors",
        "hover:bg-primary/40 data-[active]:bg-primary/60",
        isVertical ? "h-px w-full" : "w-px h-full",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute z-10 flex items-center justify-center rounded-sm border bg-background opacity-0 group-hover:opacity-100 transition-opacity shadow-sm",
          isVertical ? "h-3 w-6" : "h-6 w-3"
        )}
      >
        {isVertical ? (
          <GripHorizontal className="h-2.5 w-2.5 text-muted-foreground" />
        ) : (
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        )}
      </div>
    </Separator>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
