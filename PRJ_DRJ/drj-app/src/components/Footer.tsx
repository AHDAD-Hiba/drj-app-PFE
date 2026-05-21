import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Building2 } from 'lucide-react';
import mjccLogo from '@/assets/mjcc-official-logo.jpeg';

export const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-card/40">
      <div className="container py-10 grid gap-8 md:grid-cols-4">
        {/* Identité institutionnelle */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-lg bg-white p-1.5 shadow-sm flex-shrink-0 ring-1 ring-border">
              <img
                src={mjccLogo}
                alt="MJCC — Royaume du Maroc"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-foreground">MJCC</div>
              <div className="text-[11px] text-muted-foreground">
                {t('footer.ministryShort')}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Coordonnées */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Building2 className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
              <span>{t('footer.directionName')}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
              <span>{t('footer.address')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <a href="tel:+212522000000" className="hover:text-foreground transition-smooth">
                +212 5 22 00 00 00
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <a
                href="mailto:drj.casasettat@mjcc.gov.ma"
                className="hover:text-foreground transition-smooth break-all"
              >
                drj.casasettat@mjcc.gov.ma
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <a
                href="https://www.mjcc.gov.ma"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-smooth"
              >
                www.mjcc.gov.ma
              </a>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            {t('footer.navigation')}
          </h3>
          <ul className="space-y-2 text-xs">
            {[
              { to: '/dashboard', l: 'nav.overview' },
              { to: '/carte', l: 'nav.map' },
              { to: '/directions', l: 'nav.directions' },
              { to: '/import', l: 'nav.import' },
            ].map(i => (
              <li key={i.to}>
                <Link to={i.to} className="text-muted-foreground hover:text-foreground transition-smooth">
                  {t(i.l)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mentions légales */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            {t('footer.legal')}
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>{t('footer.legalNotices')}</li>
            <li>{t('footer.privacy')}</li>
            <li>{t('footer.termsOfUse')}</li>
            <li>{t('footer.accessibility')}</li>
          </ul>
          <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-soft text-primary text-[10px] font-semibold">
            {t('footer.officialApp')}
          </div>
        </div>
      </div>

      {/* Bandeau bas */}
      <div className="border-t border-border bg-muted/30">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div>
            © {year} {t('app.ministry')} —{' '}
            <span className="font-medium text-foreground">{t('footer.kingdom')}</span>
          </div>
          <div className="font-mono">
            {t('footer.version')} 1.0 · DRJ-CS
          </div>
        </div>
      </div>
    </footer>
  );
};
