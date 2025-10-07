
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';

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

      const progressBigEl = document.getElementById('progressBig');
      if (progressBigEl) progressBigEl.textContent = `${pct}%`;

      const completedItemsEl = document.getElementById('completedItems');
      if(completedItemsEl) completedItemsEl.textContent = String(done);

      const totalItemsEl = document.getElementById('totalItems');
      if(totalItemsEl) totalItemsEl.textContent = String(total);
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

    const exportPdfButton = document.getElementById('exportPdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', async () => {
        // @ts-ignore
        if (typeof html2pdf === 'undefined') {
          alert('Biblioteca html2pdf não está carregada. Recarregue a página e tente novamente.');
          return;
        }

        // Expand all sections to ensure they are rendered in the PDF
        document.querySelectorAll('.collapsible-content').forEach(content => {
          const el = content as HTMLElement;
          el.style.maxHeight = el.scrollHeight + "px";
          const trigger = el.previousElementSibling;
          if(trigger) trigger.querySelector('.chev')?.classList.add('rotate-90');
        });

        const btn = exportPdfButton as HTMLButtonElement;
        const prevText = btn.textContent;
        btn.textContent = 'Gerando PDF...';
        btn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 500)); // wait for animations

        saveState();

        const dev = ((document.getElementById('sigDevName') as HTMLInputElement)?.value || 'dev').replace(/\s+/g,'_');
        const client = ((document.getElementById('sigClientName') as HTMLInputElement)?.value || 'client').replace(/\s+/g,'_');
        const date = new Date().toISOString().slice(0,10);
        const filename = `UCS_Documentacao_Checklist_${dev}_${client}_${date}.pdf`;

        const element = document.getElementById('docArea');
        if (!element) {
          alert('Erro: área de documento não encontrada.');
          return;
        }
        
        const opt = {
          margin: 15,
          filename: filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        html2pdf().set(opt).from(element).save().then(() => {
          btn.textContent = '✅ PDF Gerado!';
          setTimeout(() => {
            btn.textContent = prevText;
            btn.disabled = false;
          }, 2000);
        }).catch((err: any) => {
          console.error('Erro na geração do PDF:', err);
          alert('Erro ao gerar PDF: ' + (err.message || err));
          btn.textContent = prevText;
          btn.disabled = false;
        });
      });
    }

    loadState();
    
    // Auto-expand all on initial load
    setTimeout(() => {
        document.querySelectorAll('.collapsible-content').forEach(content => {
            const el = content as HTMLElement;
            el.style.maxHeight = el.scrollHeight + "px";
            const trigger = el.previousElementSibling;
            if(trigger) trigger.querySelector('.chev')?.classList.add('rotate-90');
        });
    }, 200);

    return () => {
      checkboxes.forEach(cb => cb.removeEventListener('change', saveStateDebounced));
      document.querySelectorAll('.collapsible-trigger').forEach(trigger => trigger.removeEventListener('click', () => {}));
    };
  }, []);

  return (
    <>
      <Head>
        <script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js" defer></script>
      </Head>
      <style>{`
        .checklist-container { padding: 1rem; max-width: 1200px; margin: auto; display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
        main { grid-column: 1 / 2; }
        aside { grid-column: 2 / 3; position: sticky; top: 1.5rem; }
        .checklist-card { background-color: var(--card); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .checklist-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .checklist-title-section { display: flex; align-items: center; gap: 1rem; }
        .checklist-icon { width: 2.75rem; height: 2.75rem; border-radius: 0.5rem; background-color: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .checklist-title { font-size: 1.25rem; font-weight: 600; color: hsl(var(--foreground)); }
        .checklist-subtitle { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }
        .checklist-tag { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); font-weight: 600; font-size: 0.75rem; }
        .checklist-list { margin-top: 1rem; list-style: none; padding: 0; }
        .checklist-item { display: flex; align-items: start; gap: 0.75rem; padding: 0.75rem 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; }
        .checklist-item:hover { background-color: hsl(var(--muted)/0.5); }
        .checklist-item label { display: flex; align-items: start; gap: 0.75rem; cursor: pointer; flex-grow: 1; }
        .checklist-item input[type="checkbox"] { margin-top: 3px; flex-shrink: 0; width: 1.125rem; height: 1.125rem; border-radius: 0.25rem; border: 1px solid hsl(var(--border)); accent-color: hsl(var(--primary)); }
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
        .panel-title { font-weight: 600; margin-bottom: 0.75rem; }
        @media (max-width: 980px) { .checklist-container { grid-template-columns: 1fr; } aside { position: static; } }
      `}</style>
      <div className="checklist-container">
        <main>
            <div className="checklist-card">
              <div className="checklist-header">
                  <div className="checklist-title-section">
                  <div className="checklist-icon">📋</div>
                  <div>
                      <h1 className="checklist-title">Checklist de Entrega - UCS Index Platform</h1>
                      <p className="checklist-subtitle">Versão: 1.0.0 | Progresso salvo localmente no seu navegador.</p>
                  </div>
                  </div>
                  <Button id="exportPdf" size="sm">Exportar PDF</Button>
              </div>
            </div>

            <div id="docArea">
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

              <section className="checklist-card">
                <div className="collapsible-trigger">
                  <div className="title">🚀 Entrega</div>
                  <div className="chev">▸</div>
                </div>
                <div className="collapsible-content p-4">
                  <h3>📦 Arquivos Entregues</h3>
                  <ul className="checklist-list">
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_codigo" /><span className="txt">Código-fonte completo</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_doc_tecnica" /><span className="txt">Documentação técnica (`DOCUMENTACAO_TECNICA_ENTREGA.md`)</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_readme" /><span className="txt">README atualizado</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_env" /><span className="txt">Arquivo de exemplo de configuração (`env.example`)</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_checklist" /><span className="txt">Checklist de entrega</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_arquivos_backup" /><span className="txt">Backup do banco de dados (se solicitado)</span></label></li>
                  </ul>
                  <h3>🔑 Credenciais e Acessos</h3>
                  <ul className="checklist-list">
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_credenciais_firebase" /><span className="txt">Firebase: Projeto criado e configurado</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_credenciais_google_ai" /><span className="txt">Google AI: API Key configurada</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_credenciais_n8n" /><span className="txt">N8N: Instância configurada (se aplicável)</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_credenciais_dominio" /><span className="txt">Domínio: Configurado e apontando</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_credenciais_ssl" /><span className="txt">SSL: Certificado configurado</span></label></li>
                  </ul>
                  <h3>🎯 Funcionalidades Testadas</h3>
                  <ul className="checklist-list">
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_func_login" /><span className="txt">Login/logout funcionando</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_func_dashboard" /><span className="txt">Dashboard carregando dados corretamente</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_func_export_pdf" /><span className="txt">Exportação de PDF funcionando</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_func_export_excel" /><span className="txt">Exportação de Excel funcionando</span></label></li>
                    <li className="checklist-item"><label><input type="checkbox" data-key="entrega_func_preview" /><span className="txt">Preview de relatórios funcionando</span></label></li>
                  </ul>
                </div>
              </section>

              <section className="checklist-card">
                  <div className="collapsible-trigger">
                      <div className="title">✅ Assinaturas</div>
                      <div className="chev">▸</div>
                  </div>
                  <div className="collapsible-content p-4">
                      <h3>Desenvolvedor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                              <label htmlFor="sigDevName" className="text-sm font-medium">Nome:</label>
                              <input id="sigDevName" className="sig-input" placeholder="Nome do desenvolvedor" />
                          </div>
                          <div>
                              <label htmlFor="sigDevDate" className="text-sm font-medium">Data:</label>
                              <input id="sigDevDate" type="date" className="sig-input" />
                          </div>
                      </div>
                      <h3 className="mt-6">Cliente</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                              <label htmlFor="sigClientName" className="text-sm font-medium">Nome:</label>
                              <input id="sigClientName" className="sig-input" placeholder="Nome do cliente" />
                          </div>
                          <div>
                              <label htmlFor="sigClientDate" className="text-sm font-medium">Data:</label>
                              <input id="sigClientDate" type="date" className="sig-input" />
                          </div>
                      </div>
                  </div>
              </section>
            </div>
        </main>
        <aside>
          <div className="checklist-card">
            <h3 className="panel-title">Progresso Geral</h3>
            <div className="text-center my-4">
              <span id="progressBig" className="text-5xl font-bold text-primary">0%</span>
            </div>
            <div className="progress-bar-container">
              <div id="progressBar" className="progress-bar-fill"></div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span><span id="completedItems">0</span> Concluídos</span>
              <span><span id="totalItems">0</span> Total</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
