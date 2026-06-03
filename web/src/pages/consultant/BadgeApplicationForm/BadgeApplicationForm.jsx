import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, CONSULTANT } from '../../../routes/paths';
import Icon from '../../../components/Icons/Icons';
import Stepper from '../../../components/Stepper/Stepper';
import FileDropZone from '../../../components/FileDropZone/FileDropZone';
import styles from './BadgeApplicationForm.module.css';

const STEPS = [
	{ label: 'Selecionar Badge' },
	{ label: 'Enviar Evidências' },
	{ label: 'Aceitar Termos e Condições' },
	{ label: 'Submissão' },
];

const MOCK_BADGE = {
	title: 'UI/UX Designer',
	description:
		'Este badge certifica competências em design de interfaces e experiência do utilizador, incluindo prototipagem, design systems, testes de usabilidade e metodologias centradas no utilizador. Válido para consultores que demonstrem proficiência nas ferramentas e processos de UX da Softinsa.',
	points: 300,
	level: 'Junior (A)',
	area: 'Design',
	hours: '40h',
};

const MOCK_REQUIREMENTS = [
	{
		id: 1,
		title: 'Certificação Técnica',
		description:
			'Possuir certificação válida na tecnologia principal do badge. A certificação deve ter sido obtida nos últimos 2 anos e ser emitida por uma entidade reconhecida.',
		evidences: [],
	},
	{
		id: 2,
		title: 'Certificação Técnica',
		description:
			'Possuir certificação válida na tecnologia principal do badge. A certificação deve ter sido obtida nos últimos 2 anos e ser emitida por uma entidade reconhecida.',
		evidences: [],
	},
	{
		id: 3,
		title: 'Certificação Técnica',
		description:
			'Possuir certificação válida na tecnologia principal do badge. A certificação deve ter sido obtida nos últimos 2 anos e ser emitida por uma entidade reconhecida.',
		evidences: [],
	},
];

const MOCK_FILES = [
	{ name: 'certificado_cloud.pdf', extension: 'PDF', size: 245 * 1024 },
	{ name: 'projeto_frontend.pdf', extension: 'PDF', size: 1.2 * 1024 * 1024 },
	{ name: 'avaliacao_desempenho.pdf', extension: 'PDF', size: 89 * 1024 },
];

export default function BadgeApplicationForm() {
	const { t } = useTranslation();
	const { id } = useParams();
	const navigate = useNavigate();

	const [files, setFiles] = useState(MOCK_FILES);
	const [expandedReqs, setExpandedReqs] = useState({ 1: true, 2: true, 3: true });
	const [notes, setNotes] = useState('');
	const [termsAccepted, setTermsAccepted] = useState(false);

	const badge = MOCK_BADGE;
	const requirements = MOCK_REQUIREMENTS;

	function handleAddFile(file) {
		setFiles((prev) => [
			...prev,
			{ name: file.name, extension: file.name.split('.').pop().toUpperCase(), size: file.size },
		]);
	}

	function handleRemoveFile(index) {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}

	function toggleRequirement(reqId) {
		setExpandedReqs((prev) => ({ ...prev, [reqId]: !prev[reqId] }));
	}

	function handleCancel() {
		navigate(SHARED.APPLICATIONS);
	}

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav className={styles.breadcrumb} aria-label="breadcrumb">
				<Link to={CONSULTANT.ACHIEVEMENTS}>
					{t('badgeApplication.achievements', { defaultValue: 'Conquistas' })}
				</Link>
				<span className={styles.breadcrumbSeparator}>
					<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				</span>
				<span className={styles.breadcrumbActive}>
					{badge.title}
				</span>
			</nav>

			{/* Page Title */}
			<h1 className={styles.pageTitle}>
				{t('badgeApplication.title', { defaultValue: 'Candidatura ao Badge' })}: {badge.title}
			</h1>

			{/* Main Content */}
			<div className="d-flex flex-column" style={{ gap: 24 }}>
				{/* Stepper Card */}
				<div className={styles.stepperCard}>
					<p className={styles.cardTitle}>
						{t('badgeApplication.applicationState', { defaultValue: 'Estado da Candidatura' })}
					</p>
					<Stepper steps={STEPS} activeStep={1} />
				</div>

				{/* Badge Info Card */}
				<div className={styles.badgeCard}>
					<div className={styles.badgeIcon}>
						<Icon name="trophy" size={42} color="var(--color-badge-premium)" />
					</div>
					<div className={styles.badgeBody}>
						<h2 className={styles.badgeName}>Badge {badge.title}</h2>
						<div className={styles.chipRow}>
							<span className={`${styles.chip} ${styles.chipGreen}`}>
								<Icon name="star" size={16} color="var(--color-green-on-soft)" />
								+ {badge.points} pontos
							</span>
							<span className={`${styles.chip} ${styles.chipBlue}`}>
								<Icon name="evolution" size={16} color="var(--color-blue-on-soft)" />
								{badge.level}
							</span>
							<span className={`${styles.chip} ${styles.chipPurple}`}>
								<Icon name="skills" size={16} color="var(--color-purple-on-soft)" />
								{badge.area}
							</span>
							<span className={`${styles.chip} ${styles.chipOrange}`}>
								<Icon name="clock" size={16} color="var(--color-orange-on-soft)" />
								{badge.hours}
							</span>
						</div>
						<p className={styles.badgeDescription}>{badge.description}</p>
					</div>
				</div>

				{/* Two Column: Evidence + Requirements */}
				<div className={styles.twoColumn}>
					{/* Left: Evidence Upload */}
					<div className={styles.evidenceCard}>
						<h2 className={styles.sectionTitle}>
							{t('badgeApplication.myEvidence', { defaultValue: 'As Minhas Evidências' })}
						</h2>
						<FileDropZone
							files={files}
							onAdd={handleAddFile}
							onRemove={handleRemoveFile}
							maxSizeLabel="500MB"
						/>
					</div>

					{/* Right: Requirements */}
					<div className={styles.requirementsCard}>
						<h2 className={styles.sectionTitle}>
							{t('badgeApplication.requirements', { defaultValue: 'Requisitos' })}
						</h2>
						<div className={styles.requirementsList}>
							{requirements.map((req) => (
								<RequirementAccordion
									key={req.id}
									requirement={req}
									isOpen={!!expandedReqs[req.id]}
									onToggle={() => toggleRequirement(req.id)}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Additional Notes */}
				<div className={styles.notesCard}>
					<h2 className={styles.notesTitle}>
						{t('badgeApplication.additionalNotes', { defaultValue: 'Notas Adicionais' })}
					</h2>
					<textarea
						className={styles.notesTextarea}
						placeholder={t('badgeApplication.notesPlaceholder', {
							defaultValue: 'Adicione notas ou observações para os validadores...',
						})}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>

				{/* Terms & Conditions */}
				<div className={styles.termsCard}>
					<div className={styles.checkboxRow}>
						<input
							type="checkbox"
							id="terms"
							className={styles.checkbox}
							checked={termsAccepted}
							onChange={(e) => setTermsAccepted(e.target.checked)}
						/>
						<label htmlFor="terms" className={styles.checkboxLabel}>
							{t('badgeApplication.acceptTermsPrefix', { defaultValue: 'Aceito os ' })}
							<a href="#terms">{t('badgeApplication.termsLink', { defaultValue: 'termos e condições' })}</a>
							{t('badgeApplication.acceptTermsMiddle', { defaultValue: ' e a ' })}
							<a href="#privacy">
								{t('badgeApplication.privacyLink', { defaultValue: 'política de privacidade' })}
							</a>
							{t('badgeApplication.acceptTermsSuffix', { defaultValue: ' da plataforma.' })}
						</label>
					</div>
					<p className={styles.disclaimer}>
						{t('badgeApplication.disclaimer', {
							defaultValue:
								'Ao submeter esta candidatura, você declara que todas as informações fornecidas são verdadeiras e precisas. A plataforma reserva-se o direito de verificar todas as evidências apresentadas e pode solicitar documentação adicional. O processo de avaliação pode levar até 7 dias úteis. Candidaturas com informações falsas serão automaticamente rejeitadas e podem resultar na suspensão da conta.',
						})}
					</p>
				</div>

				{/* Action Buttons */}
				<div className={styles.actions}>
					<button type="button" className={styles.cancelBtn} onClick={handleCancel}>
						{t('badgeApplication.cancel', { defaultValue: 'Voltar / Cancelar' })}
					</button>
					<button type="button" className={styles.submitBtn} disabled={!termsAccepted}>
						<Icon name="send" size={16} color="#fff" />
						{t('badgeApplication.submit', { defaultValue: 'Enviar Candidatura' })}
					</button>
				</div>
			</div>
		</div>
	);
}

function RequirementAccordion({ requirement, isOpen, onToggle }) {
	const { t } = useTranslation();
	const evidenceCount = requirement.evidences?.length || 0;

	return (
		<div className={styles.reqItem}>
			<div
				className={styles.reqHeader}
				onClick={onToggle}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => e.key === 'Enter' && onToggle()}
				aria-expanded={isOpen}
			>
				<div className={styles.reqIconCircle}>
					<Icon name="certificate" size={16} color="var(--color-outline)" />
				</div>
				<div className={styles.reqBody}>
					<h4 className={styles.reqTitle}>{requirement.title}</h4>
					<p className={styles.reqDescription}>{requirement.description}</p>
				</div>
				<div className={`${styles.reqChevron} ${isOpen ? styles.reqChevronOpen : ''}`}>
					<Icon name="keyboard_arrow_down" size={16} color="var(--color-outline)" />
				</div>
			</div>

			{isOpen && (
				<div className={styles.reqContent}>
					<div className={styles.reqEvidenceHeader}>
						<span className={styles.reqEvidenceCount}>
							{t('badgeApplication.associatedEvidence', {
								defaultValue: `Evidências Associadas (${evidenceCount})`,
							})}
						</span>
						<button type="button" className={styles.reqAddBtn}>
							<Icon name="add" size={16} color="var(--color-secondary)" />
							{t('badgeApplication.add', { defaultValue: 'Adicionar' })}
						</button>
					</div>
					<div className={styles.reqDropZone}>
						<p className={styles.reqDropZoneText}>
							{t('badgeApplication.dragEvidence', {
								defaultValue: 'Arraste uma evidência para aqui',
							})}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
