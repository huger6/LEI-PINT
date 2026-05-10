import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WelcomeCard from '../../components/WelcomeCard/WelcomeCard';
import { getApplications } from '../../services/applicationService';

const STATE_BADGE_CLASS = {
  Open: 'bg-secondary',
  Submitted: 'bg-primary',
  'In validation': 'bg-warning text-dark',
  Closed: 'bg-success',
};

export default function ConsultantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, open: 0, submitted: 0, closed: 0 });
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const appData = await getApplications();
        const apps = appData.data || appData || [];
        if (ignore) return;

        const total = apps.length;
        const open = apps.filter((a) => (a.application_state || a.state) === 'Open').length;
        const submitted = apps.filter((a) => (a.application_state || a.state) === 'Submitted').length;
        const closed = apps.filter((a) => (a.application_state || a.state) === 'Closed').length;

        setStats({ total, open, submitted, closed });
        setRecentApps(apps.slice(0, 5));
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  return (
    <div>
      <WelcomeCard />

      <div className="row g-4 mb-4 mt-2">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Candidaturas</h6>
              <h3 className="mb-0">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Em Aberto</h6>
              <h3 className="mb-0 text-secondary">{stats.open}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Submetidas</h6>
              <h3 className="mb-0 text-primary">{stats.submitted}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Concluídas</h6>
              <h3 className="mb-0 text-success">{stats.closed}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Candidaturas Recentes</h5>
                <Link to="/applications" className="small">Ver todas</Link>
              </div>

              {recentApps.length === 0 ? (
                <p className="text-muted small mb-0">Ainda não tem candidaturas.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Badge</th>
                        <th>Estado</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApps.map((app) => {
                        const state = app.application_state || app.state;
                        return (
                          <tr
                            key={app.application_guid || app.applicationGuid}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/applications/${app.application_guid || app.applicationGuid}`)}
                          >
                            <td className="fw-medium">
                              {app.badge?.badge_title || app.badge?.badgeTitle || '—'}
                            </td>
                            <td>
                              <span className={`badge ${STATE_BADGE_CLASS[state] || 'bg-secondary'}`}>
                                {state}
                              </span>
                            </td>
                            <td className="text-muted small">
                              {(() => {
                                const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
                                return dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : '—';
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Ações Rápidas</h5>
              <div className="d-flex flex-column gap-2">
                <Link to="/catalog" className="btn btn-outline-primary text-start">
                  <i className="bi bi-search me-2" />
                  Explorar Catálogo
                </Link>
                <Link to="/applications" className="btn btn-outline-primary text-start">
                  <i className="bi bi-file-text me-2" />
                  Minhas Candidaturas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}