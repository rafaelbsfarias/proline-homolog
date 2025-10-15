import { useState } from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';

interface UseExpandableSectionReturn {
  isExpanded: boolean;
  toggleExpand: () => void;
  headerAction: React.ReactNode;
}

export function useExpandableSection(
  initialState = false,
  styles?: { toggleButton?: string }
): UseExpandableSectionReturn {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const headerAction = (
    <button onClick={toggleExpand} className={styles?.toggleButton}>
      {isExpanded ? (
        <>
          Recolher <LuChevronUp size={18} />
        </>
      ) : (
        <>
          Expandir <LuChevronDown size={18} />
        </>
      )}
    </button>
  );

  return {
    isExpanded,
    toggleExpand,
    headerAction,
  };
}
