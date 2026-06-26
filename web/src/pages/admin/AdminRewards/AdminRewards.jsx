import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminListRewards, createReward, updateReward, deleteReward } from '../../../features/rewards/api/rewardsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import styles from './AdminRewards.module.css';

const CATEGORIES = ['course', 'voucher', 'title', 'physical', 'subscription'];

// Blank form used for the "create reward" modal.
const emptyForm = {
	name: '',
	category: 'course',
	costPoints: 0,
	imgUrl: '',
	accessLink: '',
	accessInfo: '',
	description: '',
	isActive: true,
};

// Admin store-reward management: list, create, edit (incl. image) and deactivate.
export default function AdminRewards() {
	// i18n helper.
	const { t } = useTranslation();
	// Rewards list (active + inactive).
	const [rewards, setRewards] = useState([]);
	// Initial load flag.
	const [loading, setLoading] = useState(true);
	// Page-level error message.
	const [error, setError] = useState('');
	// Create/edit modal visibility.
	const [modalOpen, setModalOpen] = useState(false);
	// Reward being edited (null = create mode).
	const [editItem, setEditItem] = useState(null);
	// Current form values.
	const [form, setForm] = useState(emptyForm);
	// Field-level validation errors.
	const [errors, setErrors] = useState({});
	// Save in-flight flag.
	const [saving, setSaving] = useState(false);
	// Reward pending delete confirmation.
	const [confirmDelete, setConfirmDelete] = useState(null);

	// Fetch all rewards.
	const load = useCallback(async () => {
		setLoading(true);
		try {
			setRewards(await adminListRewards());
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, []);

	// Load rewards on mount.
	useEffect(() => { load(); }, [load]);

	// Open the modal in create mode.
	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setErrors({});
		setModalOpen(true);
	}

	// Open the modal in edit mode, pre-filling the reward's fields.
	function openEdit(r) {
		setEditItem(r);
		setForm({
			name: r.name || '',
			category: r.category || 'course',
			costPoints: r.costPoints ?? 0,
			imgUrl: r.imgUrl || '',
			accessLink: r.accessLink || '',
			accessInfo: r.accessInfo || '',
			description: r.description || '',
			isActive: r.isActive !== false,
		});
		setErrors({});
		setModalOpen(true);
	}

	// Update a single form field.
	function setField(key, value) {
		setForm((prev) => ({ ...prev, [key]: value }));
		setErrors((prev) => ({ ...prev, [key]: '' }));
	}

	// Validate required fields client-side.
	function validate() {
		const next = {};
		if (!form.name.trim()) next.name = t('adminRewards.errName');
		if (form.costPoints === '' || Number(form.costPoints) < 0) next.costPoints = t('adminRewards.errCost');
		if (form.imgUrl && !/^https?:\/\//i.test(form.imgUrl.trim())) next.imgUrl = t('adminRewards.errUrl');
		if (form.accessLink && !/^https?:\/\//i.test(form.accessLink.trim())) next.accessLink = t('adminRewards.errUrl');
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	// Build the API payload from the form.
	function payload() {
		return {
			name: form.name.trim(),
			category: form.category,
			costPoints: Number(form.costPoints) || 0,
			imgUrl: form.imgUrl.trim() || null,
			accessLink: form.accessLink.trim() || null,
			accessInfo: form.accessInfo.trim() || null,
			description: form.description.trim() || null,
			isActive: form.isActive,
		};
	}

	// Create or update the reward, then refresh the list.
	async function handleSave() {
		if (!validate()) return;
		setSaving(true);
		setError('');
		try {
			if (editItem) await updateReward(editItem.rewardGuid, payload());
			else await createReward(payload());
			setModalOpen(false);
			await load();
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	}

	// Deactivate the confirmed reward.
	async function handleDelete() {
		if (!confirmDelete) return;
		try {
			await deleteReward(confirmDelete.rewardGuid);
			setConfirmDelete(null);
			await load();
		} catch (err) {
			setError(resolveErrorMessage(err));
			setConfirmDelete(null);
		}
	}

	const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: t(`adminRewards.categories.${c}`) }));

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<h1 className={styles.title}>{t('adminRewards.title')}</h1>
				<Button onClick={openCreate}>
					<Icon name="add" size={16} /> {t('adminRewards.create')}
				</Button>
			</div>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<div className={styles.tableCard}>
				{loading ? (
					<TableSkeleton rows={5} columns={5} />
				) : rewards.length === 0 ? (
					<p className={styles.empty}>{t('adminRewards.empty')}</p>
				) : (
					<div className="table-responsive">
						<table className={`table align-middle mb-0 ${styles.table}`}>
							<thead>
								<tr>
									<th>{t('adminRewards.colReward')}</th>
									<th>{t('adminRewards.colCategory')}</th>
									<th className={styles.numCol}>{t('adminRewards.colCost')}</th>
									<th>{t('adminRewards.colStatus')}</th>
									<th className={styles.actionsCol}>{t('adminRewards.colActions')}</th>
								</tr>
							</thead>
							<tbody>
								{rewards.map((r) => (
									<tr key={r.rewardGuid}>
										<td>
											<div className={styles.rewardCell}>
												<span className={styles.thumb}>
													{r.imgUrl ? <img src={r.imgUrl} alt="" /> : <Icon name="badge-premium" size={18} color="var(--color-purple-on-soft)" />}
												</span>
												<span className={styles.rewardName}>{r.name}</span>
											</div>
										</td>
										<td>{t(`adminRewards.categories.${r.category || 'course'}`, { defaultValue: r.category })}</td>
										<td className={styles.numCol}>{Number(r.costPoints).toLocaleString('pt-PT')}</td>
										<td>
											<span className={`${styles.statusChip} ${r.isActive ? styles.active : styles.inactive}`}>
												{t(r.isActive ? 'adminRewards.statusActive' : 'adminRewards.statusInactive')}
											</span>
										</td>
										<td>
											<div className={styles.actions}>
												<Tooltip text={t('shared.edit')}>
													<button type="button" className={styles.iconBtn} onClick={() => openEdit(r)} aria-label={t('shared.edit')}>
														<Icon name="pencil" size={16} />
													</button>
												</Tooltip>
												{r.isActive && (
													<Tooltip text={t('shared.delete')}>
														<button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => setConfirmDelete(r)} aria-label={t('shared.delete')}>
															<Icon name="trash" size={16} />
														</button>
													</Tooltip>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{modalOpen && (
				<Modal title={editItem ? t('adminRewards.editTitle') : t('adminRewards.createTitle')} onClose={() => setModalOpen(false)}>
					<div className={styles.form}>
						<FormInput label={t('adminRewards.name')} value={form.name} onChange={(e) => setField('name', e.target.value)} error={errors.name} required />

						<label className={styles.field}>
							<span className={styles.fieldLabel}>{t('adminRewards.category')}</span>
							<CustomSelect name="category" value={form.category} onChange={(e) => setField('category', e.target.value)} options={categoryOptions} ariaLabel={t('adminRewards.category')} />
						</label>

						<FormInput label={t('adminRewards.cost')} type="number" min={0} value={form.costPoints} onChange={(e) => setField('costPoints', e.target.value)} error={errors.costPoints} required />

						<FormInput label={t('adminRewards.imgUrl')} value={form.imgUrl} onChange={(e) => setField('imgUrl', e.target.value)} error={errors.imgUrl} placeholder="https://…" />
						{form.imgUrl && /^https?:\/\//i.test(form.imgUrl) && (
							<img className={styles.preview} src={form.imgUrl} alt={t('adminRewards.preview')} />
						)}

						<FormInput label={t('adminRewards.accessLink')} value={form.accessLink} onChange={(e) => setField('accessLink', e.target.value)} error={errors.accessLink} placeholder="https://…" />
						<FormInput label={t('adminRewards.accessInfo')} value={form.accessInfo} onChange={(e) => setField('accessInfo', e.target.value)} />
						<FormInput label={t('adminRewards.description')} value={form.description} onChange={(e) => setField('description', e.target.value)} />

						<label className={styles.checkRow}>
							<input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
							<span>{t('adminRewards.activeLabel')}</span>
						</label>

						<div className={styles.modalActions}>
							<Button variant="outlined" color="primary" onClick={() => setModalOpen(false)} disabled={saving}>{t('shared.cancel')}</Button>
							<Button onClick={handleSave} loading={saving}>{t('shared.save')}</Button>
						</div>
					</div>
				</Modal>
			)}

			<ConfirmToast
				open={!!confirmDelete}
				message={t('adminRewards.confirmDelete', { name: confirmDelete?.name || '' })}
				confirmLabel={t('shared.yes')}
				cancelLabel={t('shared.no')}
				onConfirm={handleDelete}
				onCancel={() => setConfirmDelete(null)}
			/>
		</div>
	);
}
