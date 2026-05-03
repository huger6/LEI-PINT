const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

export default function Logo() {
  return (
    <div className="d-flex justify-content-center mb-4">
      <img
        src={LOGO_SRC}
        alt="Softinsa Badges Platform"
        style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}
