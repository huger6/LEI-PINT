import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { createRequirement, updateRequirement } from '../../features/badges/api/requirementsApi';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import BadgeImagePicker from '../BadgeImagePicker/BadgeImagePicker';

function buildInitialForm(initialData) {
	return {
		requirementTitle: initialData?.requirement_title ?? initialData?.requirementTitle ?? '',
		requirementDescription: initialData?.requirement_description ?? initialData?.requirementDescription ?? '',
		requirementSequence: initialData?.requirement_sequence ?? initialData?.requirementSequence ?? '',
		badgePoints: initialData?.badge_points ?? initialData?.badgePoints ?? 0,
		requirementImgUrl: initialData?.requirement_img_url ?? initialData?.requirementImgUrl ?? '',
	};
}

export default function CreateRequirementModal({ badgeSlug, initialData = null, onClose, onSuccess }) {
	const { t } = useTranslation();
	const isEdit = Boolean(initialData);
	const [form, setForm] = useState(() => buildInitialForm(initialData));
	const [errors, setErrors] = useState({});
	const [apiError, setApiError] = useState('');
	const [saving, setSaving] = useState(false);
	const [imageUploading, setImageUploading] = useState(false);

	function setField(name, value) {
		setForm((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: '' }));
		setApiError('');
	}

	function handleChange(e) {
		setField(e.target.name, e.target.value);
	}

	function validate() {
		const next = {};
		const title = form.requirementTitle.trim();
		const desc = form.requirementDescription.trim();
		if (title.length < 2 || title.length > 150) next.requirementTitle = t('adminRequirements.errTitle');
		if (desc.length < 1 || desc.length > 5000) next.requirementDescription = t('adminRequirements.errDescription');
		if (form.requirementSequence !== '' && Number(form.requirementSequence) < 1) {
			next.requirementSequence = t('adminRequirements.errSequence');
		}
		if (Number(form.badgePoints) < 0) next.badgePoints = t('adminRequirements.errPoints');
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (imageUploading || !validate()) return;
		setSaving(true);
		setApiError('');
		try {
			const payload = {
				requirementTitle: form.requirementTitle.trim(),
				requirementDescription: form.requirementDescription.trim(),
				requirementSequence: form.requirementSequence === '' ? null : Number(form.requirementSequence),
				badgePoints: Number(form.badgePoints) || 0,
				requirementImgUrl: form.requirementImgUrl || null,
			};
			const result = isEdit
				? await updateRequirement(badgeSlug, initialData.requirement_id || initialData.requirementId, payload)
				: await createRequirement(badgeSlug, payload);
			onSuccess?.(result);
			onClose();
		} catch (err) {
			console.error(err);
			setApiError(t('adminRequirements.saveFailed'));
		} finally {
			setSaving(false);
		}
	}

	return (
		<Modal
			title={isEdit ? t('adminRequirements.editRequirement') : t('adminRequirements.newRequirement')}
			onClose={onClose}
			footer={
				<>
					<Button variant="outlined" onClick={onClose}>{t('shared.cancel')}</Button>
					<Button loading={saving} disabled={imageUploading} onClick={handleSubmit}>
						{isEdit ? t('shared.save') : t('shared.create')}
					</Button>
				</>
			}
		>
			<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
				<FormInput
					label={t('shared.title')}
					name="requirementTitle"
					value={form.requirementTitle}
					onChange={handleChange}
					error={errors.requirementTitle}
					required
				/>
				<div>
					<label htmlFor="req_desc" className="form-label">{t('shared.description')}</label>
					<textarea
						id="req_desc"
						className={`form-control ${errors.requirementDescription ? 'is-invalid' : ''}`}
						name="requirementDescription"
						rows={3}
						value={form.requirementDescription}
						onChange={handleChange}
					/>
					{errors.requirementDescription && (
						<div className="invalid-feedback d-block">{errors.requirementDescription}</div>
					)}
				</div>
				<div className="row g-3">
					<div className="col-12 col-sm-6">
						<FormInput
							label={t('adminRequirements.sequence')}
							name="requirementSequence"
							type="number"
							min={1}
							value={form.requirementSequence}
							onChange={handleChange}
							error={errors.requirementSequence}
						/>
					</div>
					<div className="col-12 col-sm-6">
						<FormInput
							label={t('shared.points')}
							name="badgePoints"
							type="number"
							min={0}
							value={form.badgePoints}
							onChange={handleChange}
							error={errors.badgePoints}
						/>
					</div>
				</div>
				<BadgeImagePicker
					label={t('adminRequirements.image')}
					value={form.requirementImgUrl}
					onChange={(url) => setField('requirementImgUrl', url)}
					onUploadingChange={setImageUploading}
				/>
				{apiError && <p className="small text-danger mb-0">{apiError}</p>}
			</form>
		</Modal>
	);
}

CreateRequirementModal.propTypes = {
	badgeSlug: PropTypes.string.isRequired,
	initialData: PropTypes.object,
	onClose: PropTypes.func.isRequired,
	onSuccess: PropTypes.func,
};
