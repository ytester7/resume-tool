import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import type { SectionId } from '@/types/resume';

export function useSectionOrder() {
  const tabs = useTabsStore();

  const meta = computed(() =>
    tabs.active ? TEMPLATE_REGISTRY[tabs.active.template] : null,
  );

  const mutable = computed(() => meta.value?.sectionOrderMutable ?? false);

  const order = computed<SectionId[]>({
    get() {
      if (!tabs.active || !meta.value) return [];
      if (!meta.value.sectionOrderMutable) return [];
      return tabs.active.sectionOrder ?? meta.value.defaultSectionOrder;
    },
    set(newOrder: SectionId[]) {
      tabs.setSectionOrder(newOrder);
    },
  });

  function resetToDefault(): void {
    tabs.setSectionOrder(null);
  }

  return { order, mutable, resetToDefault };
}
