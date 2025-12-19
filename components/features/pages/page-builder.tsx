"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutTemplate,
  Type,
  Image,
  FileText,
  Grid3x3,
  Quote,
  HelpCircle,
  AlignEndHorizontal,
  MoveVertical,
  Play,
  Megaphone,
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BlockEditor } from "./block-editor";
import type { PageBlock, BlockType } from "@/types/page";
import { createBlock, blockTypeConfig } from "@/types/page";

const blockIcons: Record<BlockType, React.ReactNode> = {
  hero: <LayoutTemplate className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  form: <FileText className="h-4 w-4" />,
  features: <Grid3x3 className="h-4 w-4" />,
  testimonial: <Quote className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  footer: <AlignEndHorizontal className="h-4 w-4" />,
  spacer: <MoveVertical className="h-4 w-4" />,
  video: <Play className="h-4 w-4" />,
  cta: <Megaphone className="h-4 w-4" />,
};

interface PageBuilderProps {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
}

interface SortableBlockItemProps {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
}

function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = blockTypeConfig[block.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border rounded-lg p-4 bg-background transition-colors",
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary border-primary",
        !block.visible && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground">
              {blockIcons[block.type]}
            </span>
            <span className="font-medium">{config.label}</span>
            {!block.visible && (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
          >
            {block.visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlockTypeButton({
  type,
  onClick,
}: {
  type: BlockType;
  onClick: () => void;
}) {
  const config = blockTypeConfig[type];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-left w-full"
    >
      <span className="text-muted-foreground">{blockIcons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{config.label}</p>
      </div>
    </button>
  );
}

export function PageBuilder({ blocks, onChange }: PageBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    onChange([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    onChange(blocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find((b) => b.id === blockId);
    if (!blockToDuplicate) return;

    const newBlock: PageBlock = {
      ...blockToDuplicate,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } as PageBlock;

    const index = blocks.findIndex((b) => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleToggleVisibility = (blockId: string) => {
    onChange(
      blocks.map((b) => (b.id === blockId ? { ...b, visible: !b.visible } : b))
    );
  };

  const handleBlockChange = (updatedBlock: PageBlock) => {
    onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  return (
    <div className="flex h-full">
      {/* Block Types Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Add Blocks</h3>
          <p className="text-sm text-muted-foreground">
            Click to add a block to your page
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              LAYOUT
            </p>
            <BlockTypeButton type="hero" onClick={() => handleAddBlock("hero")} />
            <BlockTypeButton type="cta" onClick={() => handleAddBlock("cta")} />
            <BlockTypeButton
              type="spacer"
              onClick={() => handleAddBlock("spacer")}
            />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              CONTENT
            </p>
            <BlockTypeButton type="text" onClick={() => handleAddBlock("text")} />
            <BlockTypeButton
              type="image"
              onClick={() => handleAddBlock("image")}
            />
            <BlockTypeButton
              type="video"
              onClick={() => handleAddBlock("video")}
            />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              FORMS & FEATURES
            </p>
            <BlockTypeButton type="form" onClick={() => handleAddBlock("form")} />
            <BlockTypeButton
              type="features"
              onClick={() => handleAddBlock("features")}
            />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              SOCIAL PROOF
            </p>
            <BlockTypeButton
              type="testimonial"
              onClick={() => handleAddBlock("testimonial")}
            />
            <BlockTypeButton type="faq" onClick={() => handleAddBlock("faq")} />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              PAGE SECTIONS
            </p>
            <BlockTypeButton
              type="footer"
              onClick={() => handleAddBlock("footer")}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Page Builder Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {blocks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No blocks yet</p>
                  <p className="text-muted-foreground text-center mb-4">
                    Click on a block type in the sidebar to add your first block
                  </p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onDuplicate={() => handleDuplicateBlock(block.id)}
                        onToggleVisibility={() =>
                          handleToggleVisibility(block.id)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeBlock && (
                    <div className="border rounded-lg p-4 bg-background shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {blockIcons[activeBlock.type]}
                        </span>
                        <span className="font-medium">
                          {blockTypeConfig[activeBlock.type].label}
                        </span>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Block Configuration Panel */}
      {selectedBlock && (
        <div className="w-80 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Block Settings</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedBlockId(null)}
            >
              &times;
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <BlockEditor block={selectedBlock} onChange={handleBlockChange} />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
