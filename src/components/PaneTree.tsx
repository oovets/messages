import { ChatPane } from "@/components/ChatPane";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useAppStore, type PaneNode } from "@/store/useAppStore";

interface PaneTreeProps {
  node: PaneNode;
  activePaneId: string;
  totalLeaves: number;
}

function countLeaves(node: PaneNode): number {
  if (node.type === "leaf") return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

export function PaneTree({ node, activePaneId, totalLeaves }: PaneTreeProps) {
  const setPaneLayout = useAppStore((s) => s.setPaneLayout);
  const paneLayouts = useAppStore((s) => s.paneLayouts);

  if (node.type === "leaf") {
    return (
      <ChatPane
        paneId={node.id}
        chatGUID={node.chatGUID}
        isActive={node.id === activePaneId}
        canClose={totalLeaves > 1}
      />
    );
  }

  const [a, b] = node.children;
  const aId = `panel_${a.id}`;
  const bId = `panel_${b.id}`;
  const stored = paneLayouts[node.id];
  const a0 = Number(stored?.[0]);
  const b0 = Number(stored?.[1]);
  const valid =
    Number.isFinite(a0) && Number.isFinite(b0) && a0 > 0 && b0 > 0;
  const aSize = valid ? a0 : 50;
  const bSize = valid ? b0 : 50;

  return (
    <ResizablePanelGroup
      id={node.id}
      orientation={node.direction}
      defaultLayout={{ [aId]: aSize, [bId]: bSize }}
      onLayoutChanged={(layout: Record<string, number>) => {
        setPaneLayout(node.id, [layout[aId] ?? 50, layout[bId] ?? 50]);
      }}
    >
      <ResizablePanel id={aId} minSize={15}>
        <PaneTree node={a} activePaneId={activePaneId} totalLeaves={totalLeaves} />
      </ResizablePanel>
      <ResizableHandle orientation={node.direction} />
      <ResizablePanel id={bId} minSize={15}>
        <PaneTree node={b} activePaneId={activePaneId} totalLeaves={totalLeaves} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function PaneTreeRoot() {
  const paneTree = useAppStore((s) => s.paneTree);
  const activePaneId = useAppStore((s) => s.activePaneId);
  const total = countLeaves(paneTree);
  return <PaneTree node={paneTree} activePaneId={activePaneId} totalLeaves={total} />;
}
