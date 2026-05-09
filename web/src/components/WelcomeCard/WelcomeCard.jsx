import styles from './WelcomeCard.module.css';

const stats = [
    { label: 'Badges Obtidos', value: '18', accent: true },
    { label: 'Badges Ativos', value: '6' },
    { label: 'Streak', value: '12 dias', success: true },
];

export default function WelcomeCard() {
    return (
        <section className={`${styles.card} d-flex flex-column gap-3 p-3 p-md-4`}>
            <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-between gap-4">
                <div className="d-flex flex-column gap-2">
                    <p className={`${styles.welcomeText} mb-0`}>Bem-vindo de volta</p>
                    <h2 className={`${styles.userName} mb-0`}>Ricardo Mendes</h2>

                    <div className="d-flex flex-column flex-lg-row flex-wrap gap-2 gap-lg-4">
                        <div className={`${styles.metaItem} d-flex align-items-center gap-2`}>
                            <svg className={styles.metaIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M9.62284 1.63502C9.42742 1.54589 9.21513 1.49976 9.00034 1.49976C8.78555 1.49976 8.57326 1.54589 8.37784 1.63502L1.95034 4.56002C1.81725 4.61871 1.7041 4.71482 1.62466 4.83667C1.54522 4.95851 1.50293 5.10082 1.50293 5.24627C1.50293 5.39173 1.54522 5.53404 1.62466 5.65588C1.7041 5.77773 1.81725 5.87384 1.95034 5.93252L8.38534 8.86502C8.58076 8.95416 8.79305 9.00029 9.00784 9.00029C9.22263 9.00029 9.43492 8.95416 9.63034 8.86502L16.0653 5.94002C16.1984 5.88134 16.3116 5.78522 16.391 5.66338C16.4705 5.54154 16.5127 5.39923 16.5127 5.25377C16.5127 5.10832 16.4705 4.96601 16.391 4.84417C16.3116 4.72232 16.1984 4.62621 16.0653 4.56752L9.62284 1.63502Z" />
                                <path d="M1.5 9C1.49965 9.14345 1.54044 9.28399 1.61754 9.40496C1.69464 9.52593 1.80482 9.62225 1.935 9.6825L8.385 12.615C8.5794 12.703 8.79035 12.7486 9.00375 12.7486C9.21715 12.7486 9.4281 12.703 9.6225 12.615L16.0575 9.69C16.1903 9.63033 16.3028 9.53332 16.3814 9.4108C16.4599 9.28828 16.5012 9.14555 16.5 9" />
                                <path d="M1.5 12.75C1.49965 12.8935 1.54044 13.034 1.61754 13.155C1.69464 13.2759 1.80482 13.3723 1.935 13.4325L8.385 16.365C8.5794 16.453 8.79035 16.4986 9.00375 16.4986C9.21715 16.4986 9.4281 16.453 9.6225 16.365L16.0575 13.44C16.1903 13.3803 16.3028 13.2833 16.3814 13.1608C16.4599 13.0383 16.5012 12.8955 16.5 12.75" />
                            </svg>
                            <p className={`${styles.metaText} mb-0`}>
                                Service Line: <span className={styles.metaHighlight}>Hybrid Cloud</span>
                            </p>
                        </div>

                        <div className={`${styles.metaItem} d-flex align-items-center gap-2`}>
                            <svg className={styles.metaIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M13.126 10.25C13.9304 10.2492 14.5994 10.5254 15.1621 11.0879C15.7249 11.6507 16.0012 12.32 16 13.124C15.9987 13.9294 15.7217 14.5995 15.1611 15.1631C14.602 15.7252 13.9339 16.0017 13.126 16H13.125C12.3185 16 11.649 15.7232 11.0879 15.1621C10.5271 14.6011 10.2505 13.9318 10.25 13.125C10.2496 12.3183 10.5262 11.6494 11.0879 11.0889C11.6503 10.5277 12.3204 10.2509 13.126 10.25ZM7.75 10.625V15.625H2.75V10.625H7.75ZM13.125 10.75C12.471 10.75 11.8992 10.9817 11.4404 11.4404C10.9817 11.8992 10.75 12.471 10.75 13.125C10.75 13.779 10.9817 14.3508 11.4404 14.8096C11.8992 15.2683 12.471 15.5 13.125 15.5C13.779 15.5 14.3508 15.2683 14.8096 14.8096C15.2683 14.3508 15.5 13.779 15.5 13.125C15.5 12.471 15.2683 11.8992 14.8096 11.4404C14.3508 10.9817 13.779 10.75 13.125 10.75ZM3.25 15.125H7.25V11.125H3.25V15.125ZM12.2334 7.75H5.7666L9 2.45898L12.2334 7.75ZM8.5752 4.12402L7.1123 6.4873L6.63965 7.25H11.3604L10.8877 6.4873L9.4248 4.12402L9 3.4375L8.5752 4.12402Z" />
                            </svg>
                            <p className={`${styles.metaText} mb-0`}>
                                Area: <span className={styles.metaHighlight}>LowCode</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="row g-2 g-md-3 w-100 w-xl-auto">
                    {stats.map((stat) => (
                        <div key={stat.label} className="col-12 col-sm-4">
                            <article className={`${styles.statCard} h-100`}>
                                <p className={`${styles.statLabel} mb-1`}>{stat.label}</p>
                                <p
                                    className={`${styles.statValue} mb-0 ${
                                        stat.success ? styles.statValueSuccess : stat.accent ? styles.statValueAccent : ''
                                    }`}
                                >
                                    {stat.value}
                                </p>
                            </article>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
