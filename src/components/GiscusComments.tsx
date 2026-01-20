import { useColorMode } from '@docusaurus/theme-common';
import Giscus from '@giscus/react';

export default function GiscusComments() {
  const { colorMode } = useColorMode();

  return (
    <div style={{ marginTop: '3rem' }}>
      <Giscus
        repo="imehc/imehc.github.io"
        repoId="R_kgDOKMx3qg"
        category="General"
        categoryId="DIC_kwDOKMx3qs4Cz8hm"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
