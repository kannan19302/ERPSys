"use client";

import {
  useState,
  useEffect,
  useRef,
  type FC,
  type ReactNode,
  type ComponentType,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Star,
  Clock,
  GripHorizontal,
  Pencil,
  Check,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { useTabPersistence } from "@unerp/ui-hooks";
import styles from "./module-tab-layout.module.css";

export interface ModuleTab {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  description?: string;
  advanced?: boolean;
  group?: string;
}

export interface ModuleTabLayoutProps {
  tabs: ModuleTab[];
  moduleId: string;
  moduleLabel: string;
  moduleIcon: ComponentType<{ size?: number; className?: string }>;
  moduleDescription: string;
  headerActions?: ReactNode;
  children?: ReactNode;
}

function isTabActive(
  tab: ModuleTab,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const tabParam = searchParams.get("tab");
  if (tabParam) return tabParam === tab.id;
  const cleanPath = pathname.split("?")[0];
  if (tab.href && tab.href !== "#") {
    const tabPath = tab.href.split("?")[0];
    return cleanPath === tabPath;
  }
  return tab.id === "overview" && !tabParam;
}

export const ModuleTabLayout: FC<ModuleTabLayoutProps> = ({
  tabs,
  moduleId,
  moduleLabel,
  moduleIcon: ModuleIcon,
  moduleDescription,
  headerActions,
  children,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    pinned,
    togglePin,
    isPinned,
    recent,
    trackRecent,
    customOrder,
    setCustomOrder,
    resetOrder,
  } = useTabPersistence(moduleId);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  const activeTab =
    tabs.find((t) => isTabActive(t, pathname, searchParams)) || tabs[0];
  const activeId = activeTab?.id || "overview";

  useEffect(() => {
    trackRecent(activeId);
  }, [activeId, trackRecent]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(e.target as Node)
      ) {
        setShowAdvanced(false);
      }
    };
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setShowAdvanced(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const getOrderedVisibleTabs = (): ModuleTab[] => {
    const visibleTabs = tabs.filter((t) => !t.advanced);
    if (customOrder.length > 0) {
      const tabMap = new Map(visibleTabs.map((t) => [t.id, t]));
      const ordered: ModuleTab[] = [];
      customOrder.forEach((id: string) => {
        const tab = tabMap.get(id);
        if (tab) {
          ordered.push(tab);
          tabMap.delete(id);
        }
      });
      tabMap.forEach((tab) => ordered.push(tab));
      return ordered;
    }
    return visibleTabs;
  };

  const [orderedTabs, setOrderedTabs] = useState<ModuleTab[]>(
    getOrderedVisibleTabs,
  );

  useEffect(() => {
    setOrderedTabs(getOrderedVisibleTabs());
  }, [tabs, customOrder, pinned, recent]);

  const handleDragStart = (e: DragEvent, id: string) => {
    if (!isEditing) return;
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent, targetId: string) => {
    if (!isEditing || !draggedTabId || draggedTabId === targetId) return;
    e.preventDefault();
    const currentOrderIds = orderedTabs.map((t) => t.id);
    const dragIdx = currentOrderIds.indexOf(draggedTabId);
    const targetIdx = currentOrderIds.indexOf(targetId);
    if (dragIdx !== -1 && targetIdx !== -1) {
      const newIds = [...currentOrderIds];
      const [removed] = newIds.splice(dragIdx, 1);
      if (removed) newIds.splice(targetIdx, 0, removed);
      setCustomOrder(newIds);
    }
    setDraggedTabId(null);
  };

  // Keyboard equivalent of drag-and-drop reordering (WCAG 2.1.1).
  const moveTab = (id: string, direction: -1 | 1) => {
    const currentOrderIds = orderedTabs.map((t) => t.id);
    const idx = currentOrderIds.indexOf(id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= currentOrderIds.length)
      return;
    const newIds = [...currentOrderIds];
    const [removed] = newIds.splice(idx, 1);
    if (removed) newIds.splice(targetIdx, 0, removed);
    setCustomOrder(newIds);
  };

  const handleHandleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveTab(id, -1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveTab(id, 1);
    }
  };

  const closeAdvanced = () => setShowAdvanced(false);

  const advancedTabs = tabs.filter((t) => t.advanced);
  const groups = [...new Set(advancedTabs.map((t) => t.group || "Advanced"))];

  return (
    <div className={styles.wrapper}>
      {/* Module Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.moduleIconWrap}>
            <ModuleIcon size={22} />
          </div>
          <div>
            <h1 className={styles.moduleTitle}>{moduleLabel}</h1>
            <p className={styles.moduleDesc}>{moduleDescription}</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {recent.length > 0 && (
            <div className={styles.recentBadge} title="Recently used tabs">
              <Clock size={14} />
              <span>{recent.length}</span>
            </div>
          )}
          {pinned.length > 0 && (
            <div className={styles.pinBadge} title="Pinned tabs">
              <Star size={14} />
              <span>{pinned.length}</span>
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`${styles.rearrangeBtn} ${isEditing ? styles.rearrangeBtnActive : ""}`}
            title={
              isEditing
                ? "Done editing tab layout"
                : "Customize tab layout (Drag & Drop, or Arrow keys)"
            }
            aria-label="Customize tab layout"
            aria-pressed={isEditing}
          >
            {isEditing ? <Check size={15} /> : <Pencil size={15} />}
            <span>{isEditing ? "Done" : "Rearrange"}</span>
          </button>
          {headerActions}
        </div>
      </div>

      {/* Rearrange Mode Banner */}
      {isEditing && (
        <div className={styles.editBanner}>
          <div className={styles.editBannerText}>
            <GripVertical size={16} />
            <span>
              Drag tabs below to rearrange their position. Changes save
              automatically.
            </span>
          </div>
          <button
            onClick={resetOrder}
            className={styles.resetBtn}
            title="Reset tabs to default order"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div className={styles.tabBar}>
        <div
          className={styles.tabScroll}
          role="tablist"
          aria-label={`${moduleLabel} sections`}
        >
          {orderedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            const isDraggingThis = tab.id === draggedTabId;

            return (
              <div
                key={tab.id}
                draggable={isEditing}
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tab.id)}
                onDragEnd={() => setDraggedTabId(null)}
                className={`${styles.tabWrap} ${isEditing ? styles.tabWrapEditing : ""} ${isDraggingThis ? styles.tabDragging : ""}`}
              >
                {isEditing && (
                  <button
                    type="button"
                    className={styles.dragHandle}
                    title="Drag, or press arrow keys, to rearrange"
                    aria-label={`Reorder ${tab.label} (arrow keys to move)`}
                    onKeyDown={(e) => handleHandleKeyDown(e, tab.id)}
                  >
                    <GripVertical size={13} />
                  </button>
                )}
                <Link
                  href={tab.href || `?tab=${tab.id}`}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                  title={tab.description || tab.label}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => {
                    if (isEditing) e.preventDefault();
                  }}
                >
                  {Icon && <Icon size={16} className={styles.tabIcon} />}
                  <span>{tab.label}</span>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePin(tab.id);
                      }}
                      className={`${styles.pinBtn} ${isPinned(tab.id) ? styles.pinActive : ""}`}
                      aria-label={isPinned(tab.id) ? "Unpin tab" : "Pin tab"}
                      aria-pressed={isPinned(tab.id)}
                    >
                      <Star size={12} />
                    </button>
                  )}
                  {isPinned(tab.id) && !isEditing && (
                    <div className={styles.pinIndicator} />
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Advanced Dropdown */}
        {advancedTabs.length > 0 && (
          <div className={styles.advancedWrap} ref={advancedRef}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`${styles.advancedBtn} ${showAdvanced ? styles.advancedBtnOpen : ""}`}
              aria-haspopup="menu"
              aria-expanded={showAdvanced}
            >
              <GripHorizontal size={14} />
              <span>Advanced</span>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
            {showAdvanced && (
              <div
                className={styles.advancedDropdown}
                role="menu"
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeAdvanced();
                }}
              >
                {groups.map((group) => (
                  <div key={group} className={styles.advancedGroup}>
                    <div className={styles.advancedGroupTitle}>{group}</div>
                    {advancedTabs
                      .filter((t) => (t.group || "Advanced") === group)
                      .map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <Link
                            key={tab.id}
                            href={tab.href || `?tab=${tab.id}`}
                            role="menuitem"
                            className={`${styles.advancedItem} ${tab.id === activeId ? styles.advancedItemActive : ""}`}
                            onClick={() => setShowAdvanced(false)}
                            title={tab.description}
                          >
                            {Icon && <Icon size={16} />}
                            <span>{tab.label}</span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                togglePin(tab.id);
                              }}
                              className={`${styles.advPinBtn} ${isPinned(tab.id) ? styles.pinActive : ""}`}
                              aria-label={
                                isPinned(tab.id) ? "Unpin tab" : "Pin tab"
                              }
                              aria-pressed={isPinned(tab.id)}
                            >
                              <Star size={11} />
                            </button>
                          </Link>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
