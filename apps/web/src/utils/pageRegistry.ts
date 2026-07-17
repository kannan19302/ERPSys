export interface PageMapping {
  id: string;
  formId: string;
  module: string;
  pageName: string;
  slug: string;
  isOverride: boolean;
  overridePath?: string;
}

export const getPageRegistry = (): PageMapping[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('unerp_page_registry');
  return stored ? JSON.parse(stored) : [];
};

export const savePageMapping = (mapping: Omit<PageMapping, 'id'>) => {
  const registry = getPageRegistry();
  const newMapping = { ...mapping, id: `pm_${Date.now()}` };
  registry.push(newMapping);
  localStorage.setItem('unerp_page_registry', JSON.stringify(registry));
  
  // Trigger a custom event so the sidebar can re-render if it's listening
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('unerp_page_registry_updated'));
  }
  
  return newMapping;
};

export const getMappingByPath = (path: string) => {
  const registry = getPageRegistry();
  // Check exact overrides
  const override = registry.find(m => m.isOverride && m.overridePath === path);
  if (override) return override;

  const match = path.match(/^\/app\/([^\/]+)\/([^\/]+)$/);
  if (match) {
    const moduleStr = match[1];
    const slugStr = match[2];
    return registry.find(m => !m.isOverride && m.module?.toLowerCase() === moduleStr?.toLowerCase() && m.slug === slugStr);
  }

  return null;
};

export const getMappingsByFormId = (formId: string) => {
  return getPageRegistry().filter(m => m.formId === formId);
};

export const removePageMapping = (mappingId: string) => {
  const registry = getPageRegistry();
  const newRegistry = registry.filter(m => m.id !== mappingId);
  localStorage.setItem('unerp_page_registry', JSON.stringify(newRegistry));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('unerp_page_registry_updated'));
  }
};
