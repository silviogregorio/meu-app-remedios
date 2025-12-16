import { formatCurrency } from '../../utils/formatters';

export const OfferCard = ({ offer }) => {
    const { title, description, price, original_price, image_url, whatsapp_link, sponsor } = offer;
    const discount = original_price ? ((original_price - price) / original_price) * 100 : null;

    return (
        <div className="offer-card bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow">
            {image_url ? (
                <img src={image_url} alt={title} className="w-full h-40 object-cover rounded" />
            ) : (
                <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-40 object-cover rounded" />
            )}
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">{formatCurrency(price)}</span>
                {original_price && (
                    <span className="text-sm line-through text-slate-400">{formatCurrency(original_price)}</span>
                )}
                {discount && (
                    <span className="text-sm text-green-600">-{discount.toFixed(0)}%</span>
                )}
            </div>
            {whatsapp_link && (
                <a href={whatsapp_link} target="_blank" rel="noopener noreferrer" className="mt-2 btn btn-primary">
                    Comprar via WhatsApp
                </a>
            )}
        </div>
    );
};
