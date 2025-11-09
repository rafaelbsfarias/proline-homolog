import React from 'react';
import styles from './Section.module.css';

interface SectionProps {
  background?: 'transparent' | 'white' | 'gray';
  paddingBlock?: string;
  paddingInline?: string;
  marginBottom?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * Section Component - Container responsivo reutilizável
 *
 * Substitui o pattern repetitivo de divs com estilos inline.
 * Implementa responsive padding e max-width.
 *
 * ⚠️ IMPORTANTE: Quando isLoading=true, este componente retorna null.
 * Não use com componentes que possuem callbacks de loading (ex: onLoadingChange),
 * pois isso causará deadlock - os componentes nunca serão montados para chamar
 * os callbacks que mudariam isLoading para false.
 *
 * @example
 * // ✅ Correto - componente sem callback de loading
 * <Section background="white" isLoading={showLoader}>
 *   <Toolbar />
 * </Section>
 *
 * @example
 * // ❌ Incorreto - causará loading infinito!
 * <Section isLoading={showLoader}>
 *   <DataPanel onLoadingChange={setLoading} />
 * </Section>
 *
 * @example
 * // ✅ Correto para componentes com callbacks - use visibility
 * <div style={{ visibility: showLoader ? 'hidden' : 'visible' }}>
 *   <DataPanel onLoadingChange={setLoading} />
 * </div>
 */
export const Section: React.FC<SectionProps> = ({
  background = 'transparent',
  paddingBlock,
  paddingInline,
  marginBottom,
  isLoading = false,
  children,
  maxWidth = '1200px',
  className,
}) => {
  if (isLoading) {
    return null;
  }

  const outerStyle: React.CSSProperties = {
    ...(paddingBlock && { padding: `${paddingBlock}` }),
    ...(marginBottom && { marginBottom }),
  };

  const innerStyle: React.CSSProperties = {
    ...(maxWidth && { maxWidth }),
    ...(paddingInline && { padding: `0 ${paddingInline}` }),
  };

  return (
    <div
      className={`${styles.sectionOuter} ${className || ''}`}
      data-background={background}
      style={outerStyle}
    >
      <div className={styles.sectionInner} style={innerStyle}>
        {children}
      </div>
    </div>
  );
};
