'use client';

import { useEffect } from 'react';

export default function AdminChecklistPage() {
  useEffect(() => {
    // A lógica interativa do checklist é executada aqui no cliente.
    const STORAGE_KEY = 'ucs_checklist_v2';
    const SIG_KEY = 'ucs_checklist_sigs_v2';
    const AUTOSAVE_DEBOUNCE = 600;

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-key]')) as HTMLInputElement[];

    function updateProgressUI() {
      const total = checkboxes.length;
      const done = checkboxes.filter(cb => cb.checked).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      
      const progressTextEl = document.getElementById('progressText');
      if (progressTextEl) progressTextEl.textContent = `${pct}%`;
      
      const progressBarFill = document.querySelector('.progress-bar-fill') as HTMLElement | null;
      if (progressBarFill) progressBarFill.style.width = `${pct}%`;
    }

    function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
      let timeoutId: ReturnType<typeof setTimeout>;
      return function(this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    function saveState() {
      const state: { [key: string]: boolean } = {};
      checkboxes.forEach(cb => {
        if (cb.dataset.key) {
          state[cb.dataset.key] = cb.checked;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      const sigs = {
        devName: (document.getElementById('sigDevName') as HTMLInputElement)?.value || '',
        devDate: (document.getElementById('sigDevDate') as HTMLInputElement)?.value || '',
        clientName: (document.getElementById('sigClientName') as HTMLInputElement)?.value || '',
        clientDate: (document.getElementById('sigClientDate') as HTMLInputElement)?.value || '',
      };
      localStorage.setItem(SIG_KEY, JSON.stringify(sigs));
      
      updateProgressUI();
    }

    const saveStateDebounced = debounce(saveState, AUTOSAVE_DEBOUNCE);

    function loadState() {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (rawState) {
        try {
          const state = JSON.parse(rawState);
          checkboxes.forEach(cb => {
            if (cb.dataset.key && state[cb.dataset.key]) {
              cb.checked = true;
            }
          });
        } catch (e) {
          console.warn('Could not parse checklist state', e);
        }
      }

      const rawSigs = localStorage.getItem(SIG_KEY);
      if (rawSigs) {
        try {
          const sigs = JSON.parse(rawSigs);
          (document.getElementById('sigDevName') as HTMLInputElement).value = sigs.devName || '';
          (document.getElementById('sigDevDate') as HTMLInputElement).value = sigs.devDate || '';
          (document.getElementById('sigClientName') as HTMLInputElement).value = sigs.clientName || '';
          (document.getElementById('sigClientDate') as HTMLInputElement).value = sigs.clientDate || '';
        } catch (e) {
          console.warn('Could not parse signatures state', e);
        }
      }
      updateProgressUI();
    }

    checkboxes.forEach(cb => {
      cb.addEventListener('change', saveStateDebounced);
    });

    ['sigDevName', 'sigDevDate', 'sigClientName', 'sigClientDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', saveStateDebounced);
    });

    document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const content = trigger.nextElementSibling as HTMLElement;
            const chev = trigger.querySelector('.chev');
            if (content && content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0px';
                if(chev) chev.classList.remove('rotate-90');
            } else if(content) {
                content.style.maxHeight = content.scrollHeight + "px";
                if(chev) chev.classList.add('rotate-90');
            }
        });
    });

    // Expand all on load
    document.querySelectorAll('.collapsible-content').forEach(content => {
        const el = content as HTMLElement;
        el.style.maxHeight = el.scrollHeight + "px";
        const trigger = el.previousElementSibling;
        if(trigger) trigger.querySelector('.chev')?.classList.add('rotate-90');
    });

    loadState();

    return () => {
      checkboxes.forEach(cb => cb.removeEventListener('change', saveStateDebounced));
      document.querySelectorAll('.collapsible-trigger').forEach(trigger => trigger.removeEventListener('click', () => {}));
    };
  }, []);

  return (
    <>
      <style>{`
        .checklist-container { padding: 1rem; max-width: 1200px; margin: auto; }
        .checklist-card { background-color: var(--card); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .checklist-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .checklist-title-section { display: flex; align-items: center; gap: 1rem; }
        .checklist-icon { width: 2.75rem; height: 2.75rem; border-radius: 0.5rem; background-color: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .checklist-title { font-size: 1.25rem; font-weight: 600; color: hsl(var(--foreground)); }
        .checklist-subtitle { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }
        .checklist-tag { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); font-weight: 600; font-size: 0.75rem; }
        .checklist-list { margin-top: 1rem; list-style: none; padding: 0; }
        .checklist-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; }
        .checklist-item:hover { background-color: hsl(var(--muted)/0.5); }
        .checklist-item label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; flex-grow: 1; }
        .checklist-item input[type="checkbox"] { width: 1.125rem; height: 1.125rem; border-radius: 0.25rem; border: 1px solid hsl(var(--border)); accent-color: hsl(var(--primary)); }
        .checklist-item .txt { font-size: 0.875rem; color: hsl(var(--foreground)); }
        h3 { font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: hsl(var(--primary)); }
        .sig-input { width: 100%; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); margin-top: 0.25rem; background-color: hsl(var(--background)); }
        .collapsible-trigger { cursor: pointer; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); display: flex; align-items: center; justify-content: space-between; transition: background-color 0.2s; }
        .collapsible-trigger:hover { background-color: hsl(var(--muted)/0.5); }
        .collapsible-trigger .title { font-weight: 600; }
        .collapsible-content { overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; max-height: 0; }
        .chev { transition: transform 0.2s; }
        .rotate-90 { transform: rotate(90deg); }
        .progress-bar-container { background-color: hsl(var(--muted)); border-radius: 9999px; overflow: hidden; height: 0.5rem; }
        .progress-bar-fill { background-color: hsl(var(--primary)); height: 100%; transition: width 0.3s; }
        .diagram { width:100%; height:auto; border-radius:10px; border:1px solid rgba(2,6,23,0.04); background:linear-gradient(180deg,#fff,#fbfdff); padding:12px; margin-top:12px; }
        .muted-note { font-size: 13px; color: var(--muted); margin-top: 6px; }
      `}</style>
      <div className="checklist-container">
        <div id="docArea">
            <div className="checklist-card">
            <div className="checklist-header">
                <div className="checklist-title-section">
                <div className="checklist-icon">📋</div>
                <div>
                    <h1 className="checklist-title">Checklist de Entrega - UCS Index Platform</h1>
                    <p className="checklist-subtitle">Versão: 1.0.0 | Progresso salvo localmente no seu navegador.</p>
                </div>
                </div>
                <div className="checklist-tag" id="progressText">0%</div>
            </div>
            <div className="progress-bar-container mt-4">
                <div className="progress-bar-fill"></div>
            </div>
            </div>

            <section className="checklist-card">
              <div className="section-head">
                  <div className="section-title">
                  <div className="icon">🏛️</div>
                  <div>
                      <h2>Visão Geral do Projeto</h2>
                      <div className="muted">Descrição, funcionalidades e tecnologias</div>
                  </div>
                  </div>
              </div>
              <div style={{marginTop:'10px'}}>
                  <h3>Descrição</h3>
                  <p className="muted-note">UCS Index Platform é uma aplicação web para monitoramento de índices de sustentabilidade, commodities e ativos, com análises, relatórios em PDF/Excel e integração com automações (N8N) e IA (Google Genkit).</p>
                  <h3 style={{marginTop:'10px'}}>Principais funcionalidades</h3>
                  <ul>
                  <li>Dashboard executivo em tempo real</li>
                  <li>Análise de composição e tendências</li>
                  <li>Relatórios automatizados (PDF / Excel)</li>
                  <li>Administração, auditoria e recálculos</li>
                  <li>Integração com Google AI e N8N</li>
                  </ul>
              </div>
            </section>

            <section className="checklist-card">
              <div className="section-head">
                  <div className="section-title">
                  <div className="icon">📁</div>
                  <div>
                      <h2>Estrutura de Pastas & Módulos</h2>
                      <div className="muted">Resumo da organização do repositório</div>
                  </div>
                  </div>
              </div>
              <pre className="muted-note" style={{background:'#fbfdff',padding:'12px',borderRadius:'8px',marginTop:'12px',overflow:'auto'}}>
  {`UCS/
  ├── src/
  │   ├── app/ (Next.js App Router)
  │   ├── components/
  │   ├── lib/ (ai/, firebase/, data-service)
  │   └── hooks/
  ├── docs/
  ├── public/
  ├── package.json
  └── next.config.ts`}
              </pre>
            </section>

            <section className="checklist-card">
                <div className="section-head">
                  <div className="section-title">
                    <div className="icon">🗺️</div>
                    <div>
                      <h2>Diagramas</h2>
                      <div className="muted">Arquitetura, Fluxo de Dados e Infraestrutura</div>
                    </div>
                  </div>
                </div>

                <div style={{marginTop:'12px'}}>
                  <h3>Arquitetura Técnica</h3>
                  <div className="diagram" role="img" aria-label="Diagrama de arquitetura técnica">
                    <svg viewBox="0 0 1000 360" width="100%" height="320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.12"/>
                        </filter>
                      </defs>
                      <rect x="40" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)"/>
                      <text x="150" y="70" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end</text>
                      <text x="150" y="92" fontSize="12" textAnchor="middle" fill="#6b7280">Next.js (React)</text>
                      <rect x="300" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)"/>
                      <text x="410" y="68" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Server</text>
                      <text x="410" y="90" fontSize="12" textAnchor="middle" fill="#6b7280">Cloud Functions / Serverless</text>
                      <rect x="560" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)"/>
                      <text x="670" y="68" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">Banco de Dados</text>
                      <text x="670" y="90" fontSize="12" textAnchor="middle" fill="#6b7280">Firebase Firestore</text>
                      <line x1="260" y1="80" x2="300" y2="80" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow)"/>
                      <line x1="520" y1="80" x2="560" y2="80" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow)"/>
                      <rect x="120" y="180" rx="10" ry="10" width="240" height="64" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                      <text x="240" y="205" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">N8N (Automação)</text>
                      <text x="240" y="223" fontSize="12" textAnchor="middle" fill="#6b7280">Coleta de dados e workflows</text>
                      <rect x="440" y="180" rx="10" ry="10" width="240" height="64" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                      <text x="560" y="205" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">Google AI (Genkit)</text>
                      <text x="560" y="223" fontSize="12" textAnchor="middle" fill="#6b7280">Geração de relatórios / NLP</text>
                      <line x1="240" y1="180" x2="240" y2="140" stroke="#b7d0f7" strokeWidth="2" markerEnd="url(#arrow)"/>
                      <line x1="560" y1="180" x2="560" y2="140" stroke="#b7d0f7" strokeWidth="2" markerEnd="url(#arrow)"/>
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8" />
                        </marker>
                      </defs>
                      <rect x="40" y="270" rx="8" ry="8" width="780" height="64" fill="#fbfdff" stroke="#eef4ff" />
                      <text x="70" y="295" fontSize="12" fill="#6b7280">Legenda:</text>
                      <text x="140" y="295" fontSize="12" fill="#0f172a">Frontend → Server → Firestore; N8N e Google AI integram-se via API / Webhooks</text>
                    </svg>
                  </div>
                </div>
            </section>
            
            <section className="checklist-card">
              <div className="collapsible-trigger">
                <div className="title">📋 Pré-Entrega</div>
                <div className="chev">▸</div>
              </div>
              <div className="collapsible-content p-4">
                <h3>🏗️ Desenvolvimento Concluído</h3>
                <ul className="checklist-list">
                  <li className="checklist-item"><label><input type="checkbox" data-key="dev_done_features" /><span className="txt">Todas as funcionalidades implementadas conforme especificação</span></label></li>
                  <li className="checklist-item"><label><input type="checkbox" data-key="dev_done_local_tests" /><span className="txt">Testes locais realizados com sucesso</span></label></li>
                  <li className="checklist-item"><label><input type="checkbox" data-key="dev_done_code_review" /><span className="txt">Código revisado e documentado</span></label></li>
                  <li className="checklist-item"><label><input type="checkbox" data-key="dev_done_performance" /><span className="txt">Performance otimizada</span></label></li>
                  <li className="checklist-item"><label><input type="checkbox" data-key="dev_done_responsive" /><span className="txt">Responsividade testada em diferentes dispositivos</span></label></li>
                </ul>
                <h3>📚 Documentação Completa</h3>
                <ul className="checklist-list">
                    <li className="checklist-item"><label><input type="checkbox" data-key="doc_readme" /><span className="txt">README.md atualizado</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="doc_tech" /><span className="txt">Documentação técnica de entrega criada</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="doc_env" /><span className="txt">Arquivo de exemplo de variáveis de ambiente</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="doc_install" /><span className="txt">Instruções de instalação e deploy</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="doc_diagrams" /><span className="txt">Diagramas de arquitetura atualizados</span></label></li>
                </ul>
                <h3>🔧 Configuração de Ambiente</h3>
                <ul className="checklist-list">
                    <li className="checklist-item"><label><input type="checkbox" data-key="env_vars" /><span className="txt">Variáveis de ambiente documentadas</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="env_firebase" /><span className="txt">Firebase configurado e testado</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="env_google_ai" /><span className="txt">Google AI integrado e funcionando</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="env_n8n" /><span className="txt">N8N configurado (se aplicável)</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="env_build" /><span className="txt">Build de produção testado</span></label></li>
                </ul>
              </div>
            </section>
        </div>
      </div>
    </>
  );
}
