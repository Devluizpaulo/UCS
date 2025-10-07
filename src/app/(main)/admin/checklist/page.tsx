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
      `}</style>
      <div className="checklist-container">
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
        </div>

        {/* Pré-Entrega */}
        <div className="checklist-card">
          <div className="collapsible-trigger">
            <div className="title">📋 Pré-Entrega</div>
            <div className="chev">▸</div>
          </div>
          <div className="collapsible-content">
            <h3>🏗️ Desenvolvimento Concluído</h3>
            <ul className="checklist-list">
              <li className="check-item"><label><input type="checkbox" data-key="dev_done_features" /><span className="txt">Todas as funcionalidades implementadas conforme especificação</span></label></li>
              <li className="check-item"><label><input type="checkbox" data-key="dev_done_local_tests" /><span className="txt">Testes locais realizados com sucesso</span></label></li>
              <li className="check-item"><label><input type="checkbox" data-key="dev_done_code_review" /><span className="txt">Código revisado e documentado</span></label></li>
              <li className="check-item"><label><input type="checkbox" data-key="dev_done_performance" /><span className="txt">Performance otimizada</span></label></li>
              <li className="check-item"><label><input type="checkbox" data-key="dev_done_responsive" /><span className="txt">Responsividade testada em diferentes dispositivos</span></label></li>
            </ul>
            <h3>📚 Documentação Completa</h3>
            <ul className="checklist-list">
                <li className="check-item"><label><input type="checkbox" data-key="doc_readme" /><span className="txt">README.md atualizado</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="doc_tech" /><span className="txt">Documentação técnica de entrega criada</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="doc_env" /><span className="txt">Arquivo de exemplo de variáveis de ambiente</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="doc_install" /><span className="txt">Instruções de instalação e deploy</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="doc_diagrams" /><span className="txt">Diagramas de arquitetura atualizados</span></label></li>
            </ul>
            <h3>🔧 Configuração de Ambiente</h3>
            <ul className="checklist-list">
                <li className="check-item"><label><input type="checkbox" data-key="env_vars" /><span className="txt">Variáveis de ambiente documentadas</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="env_firebase" /><span className="txt">Firebase configurado e testado</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="env_google_ai" /><span className="txt">Google AI integrado e funcionando</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="env_n8n" /><span className="txt">N8N configurado (se aplicável)</span></label></li>
                <li className="check-item"><label><input type="checkbox" data-key="env_build" /><span className="txt">Build de produção testado</span></label></li>
            </ul>
          </div>
        </div>
        
        {/* Entrega */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">🚀 Entrega</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>📦 Arquivos Entregues</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_source_code" /><span className="txt">Código-fonte completo</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_tech_docs" /><span className="txt">Documentação técnica (`DOCUMENTACAO_TECNICA_ENTREGA.md`)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_readme" /><span className="txt">README atualizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_env_example" /><span className="txt">Arquivo de exemplo de configuração (`env.example`)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_checklist" /><span className="txt">Checklist de entrega</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="delivery_db_backup" /><span className="txt">Backup do banco de dados (se solicitado)</span></label></li>
                </ul>
                <h3>🔑 Credenciais e Acessos</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="creds_firebase" /><span className="txt">Firebase: Projeto criado e configurado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="creds_google_ai" /><span className="txt">Google AI: API Key configurada</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="creds_n8n" /><span className="txt">N8N: Instância configurada (se aplicável)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="creds_domain" /><span className="txt">Domínio: Configurado e apontando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="creds_ssl" /><span className="txt">SSL: Certificado configurado</span></label></li>
                </ul>
                 <h3>🎯 Funcionalidades Testadas</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="features_login" /><span className="txt">Login/logout funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_dashboard" /><span className="txt">Dashboard carregando dados corretamente</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_pdf" /><span className="txt">Exportação de PDF funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_excel" /><span className="txt">Exportação de Excel funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_preview" /><span className="txt">Preview de relatórios funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_composition" /><span className="txt">Análise de composição funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_admin" /><span className="txt">Administração de usuários funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_audit" /><span className="txt">Logs de auditoria funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_ai" /><span className="txt">IA integrada funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="features_mobile" /><span className="txt">Responsividade mobile funcionando</span></label></li>
                </ul>
            </div>
        </div>

        {/* Testes de Aceite */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">🔍 Testes de Aceite</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>✅ Testes Funcionais</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="uat_login" /><span className="txt">Usuário consegue fazer login</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_dashboard_realtime" /><span className="txt">Dashboard exibe dados em tempo real</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_charts" /><span className="txt">Gráficos carregam corretamente</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_exports" /><span className="txt">Exportações geram arquivos válidos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_preview" /><span className="txt">Preview mostra dados corretos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_admin_crud" /><span className="txt">Administração permite CRUD de usuários</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_audit_logs" /><span className="txt">Sistema de auditoria registra ações</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="uat_ai_reports" /><span className="txt">IA gera relatórios coerentes</span></label></li>
                </ul>
                <h3>✅ Testes de Performance</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="perf_initial_load" /><span className="txt">Carregamento inicial &lt; 3 segundos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="perf_navigation" /><span className="txt">Navegação entre páginas &lt; 1 segundo</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="perf_pdf_export" /><span className="txt">Exportação de PDF &lt; 10 segundos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="perf_excel_export" /><span className="txt">Exportação de Excel &lt; 15 segundos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="perf_charts" /><span className="txt">Gráficos renderizam &lt; 2 segundos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="perf_multiuser" /><span className="txt">Sistema suporta múltiplos usuários simultâneos</span></label></li>
                </ul>
                 <h3>✅ Testes de Compatibilidade</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="compat_chrome" /><span className="txt">Chrome (última versão)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="compat_firefox" /><span className="txt">Firefox (última versão)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="compat_safari" /><span className="txt">Safari (última versão)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="compat_edge" /><span className="txt">Edge (última versão)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="compat_ios" /><span className="txt">Mobile: iOS Safari</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="compat_android" /><span className="txt">Mobile: Android Chrome</span></label></li>
                </ul>
            </div>
        </div>

        {/* Segurança */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">🛡️ Segurança</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>🔐 Autenticação e Autorização</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="sec_secure_login" /><span className="txt">Login seguro implementado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="sec_role_access" /><span className="txt">Controle de acesso por roles</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="sec_sessions" /><span className="txt">Sessões seguras</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="sec_auto_logout" /><span className="txt">Logout automático por inatividade</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="sec_common_attacks" /><span className="txt">Proteção contra ataques comuns</span></label></li>
                </ul>
                 <h3>🛡️ Proteção de Dados</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="data_encryption" /><span className="txt">Dados sensíveis criptografados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="data_validation" /><span className="txt">Validação de inputs</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="data_sanitization" /><span className="txt">Sanitização de dados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="data_rate_limiting" /><span className="txt">Rate limiting implementado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="data_security_logs" /><span className="txt">Logs de segurança ativos</span></label></li>
                </ul>
                <h3>📋 Conformidade LGPD</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="lgpd_explicit_consent" /><span className="txt">Consentimento explícito implementado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="lgpd_privacy_policy" /><span className="txt">Política de privacidade atualizada</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="lgpd_right_to_be_forgotten" /><span className="txt">Direito ao esquecimento implementado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="lgpd_audit_logs" /><span className="txt">Logs de auditoria completos</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="lgpd_secure_backup" /><span className="txt">Backup seguro de dados</span></label></li>
                </ul>
            </div>
        </div>

        {/* Deploy */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">🚀 Deploy</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>🌐 Produção</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_build" /><span className="txt">Build de produção gerado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_success" /><span className="txt">Deploy realizado com sucesso</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_domain" /><span className="txt">Domínio configurado e funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_ssl" /><span className="txt">SSL configurado e funcionando</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_env_vars" /><span className="txt">Variáveis de ambiente configuradas</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="deploy_prod_tests" /><span className="txt">Testes em produção realizados</span></label></li>
                </ul>
                <h3>📊 Monitoramento</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="monitoring_error_logs" /><span className="txt">Logs de erro configurados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="monitoring_uptime" /><span className="txt">Uptime monitoring ativo</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="monitoring_performance" /><span className="txt">Performance monitoring ativo</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="monitoring_alerts" /><span className="txt">Alertas de erro configurados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="monitoring_auto_backup" /><span className="txt">Backup automático configurado</span></label></li>
                </ul>
                <h3>🔄 CI/CD</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="cicd_pipeline" /><span className="txt">Pipeline de deploy automatizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cicd_auto_tests" /><span className="txt">Testes automatizados configurados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cicd_auto_rollback" /><span className="txt">Rollback automático configurado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cicd_versioning" /><span className="txt">Versionamento implementado</span></label></li>
                </ul>
            </div>
        </div>

        {/* Treinamento */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">📚 Treinamento</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>👥 Usuários Finais</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="train_user_manual" /><span className="txt">Manual do usuário criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_basic" /><span className="txt">Treinamento básico realizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_faq" /><span className="txt">FAQ criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_support_config" /><span className="txt">Suporte configurado</span></label></li>
                </ul>
                <h3>🔧 Administradores</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="train_admin_manual" /><span className="txt">Manual administrativo criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_tech" /><span className="txt">Treinamento técnico realizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_maintenance_docs" /><span className="txt">Procedimentos de manutenção documentados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_support_contacts" /><span className="txt">Contatos de suporte definidos</span></label></li>
                </ul>
            </div>
        </div>

        {/* Suporte Pós-Entrega */}
        <div className="checklist-card">
            <div className="collapsible-trigger">
                <div className="title">📞 Suporte Pós-Entrega</div>
                <div className="chev">▸</div>
            </div>
            <div className="collapsible-content">
                <h3>🆘 Suporte Imediato (30 dias)</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="support_email" /><span className="txt">Suporte via email configurado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_sla" /><span className="txt">SLA de resposta definido (24h)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_emergency" /><span className="txt">Procedimentos de emergência documentados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_remote_access" /><span className="txt">Acesso remoto configurado (se necessário)</span></label></li>
                </ul>
                <h3>📈 Suporte Contínuo</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="support_contract" /><span className="txt">Contrato de suporte definido</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_preventive" /><span className="txt">Manutenção preventiva agendada</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_security_updates" /><span className="txt">Atualizações de segurança planejadas</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="support_routine_backup" /><span className="txt">Backup de rotina configurado</span></label></li>
                </ul>
                 <h3>📊 Relatórios</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="report_delivery" /><span className="txt">Relatório de entrega criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="report_performance" /><span className="txt">Métricas de performance documentadas</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="report_evolution" /><span className="txt">Plano de evolução definido</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="report_next_steps" /><span className="txt">Próximos passos acordados</span></label></li>
                </ul>
            </div>
        </div>

        {/* Assinaturas */}
        <div className="checklist-card">
            <h3>✅ Assinaturas</h3>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1.5rem' }}>
                <div>
                    <label className="text-sm font-medium text-gray-700">Desenvolvedor</label>
                    <input id="sigDevName" className="sig-input" placeholder="Nome do desenvolvedor" />
                    <input id="sigDevDate" type="date" className="sig-input" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Cliente</label>
                    <input id="sigClientName" className="sig-input" placeholder="Nome do cliente" />
                    <input id="sigClientDate" type="date" className="sig-input" />
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
