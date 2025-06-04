export const reservationMailTemplate = (
  restaurantName: string,
  date: string,
  time: string,
  guestCount: number,
  promotionDes: string,
  name: string,
  phone: string,
): string => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Nhận Đặt Bàn</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <!-- Email Container -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Main Content Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 25px 20px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                ✅ Đặt Bàn Thành Công
                            </h1>
                            <p style="color: #dcfce7; font-size: 14px; margin: 8px 0 0 0;">
                                Cảm ơn bạn đã chọn nhà hàng chúng tôi!
                            </p>
                        </td>
                    </tr>

                    <!-- Booking Details -->
                    <tr>
                        <td style="padding: 25px 20px;">
                            <!-- Booking Info Card -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                                            📋 Thông Tin Đặt Bàn
                                        </h2>
                                        
                                        <!-- Booking Details Grid -->
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #64748b; font-size: 14px; font-weight: 500;">🍔 Nhà hàng:</span>
                                                </td>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${restaurantName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="50%" style="padding: 8px 0; vertical-align: top;">
                                                    <div style="display: flex; align-items: center;">
                                                        <span style="color: #64748b; font-size: 14px; font-weight: 500;">📅 Ngày:</span>
                                                    </div>
                                                </td>
                                                <td width="50%" style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${date}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #64748b; font-size: 14px; font-weight: 500;">🕐 Giờ:</span>
                                                </td>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${time}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #64748b; font-size: 14px; font-weight: 500;">👥 Số khách:</span>
                                                </td>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${guestCount} người</span>
                                                </td>
                                            </tr>
                                                                                        <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #64748b; font-size: 14px; font-weight: 500;">👤 Tên khách:</span>
                                                </td>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${name}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #64748b; font-size: 14px; font-weight: 500;">📞 SDT:</span>
                                                </td>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <span style="color: #1e293b; font-size: 14px; font-weight: 600;">${phone}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${
                              promotionDes
                                ? `
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 15px 20px; text-align: center;">
                                        <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 5px 0; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            🎉 Ưu Đãi Đặc Biệt
                                        </h3>
                                        <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.95;">
                                            ${promotionDes}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                                `
                                : ``
                            }

                            <!-- Contact Info -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <tr>
                                    <td style="padding: 15px; text-align: center;">
                                        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                                            📍 <strong>Địa chỉ:</strong> Nam Từ Liêm, Hà Nội
                                        </p>
                                        <p style="color: #64748b; font-size: 13px; margin: 0;">
                                            📞 <strong>Hotline:</strong> 1900 1234 | 💬 <strong>Zalo:</strong> 0376 219 010
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1e293b; padding: 20px; text-align: center;">
                            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                                Vui lòng đến đúng giờ. Bàn sẽ được giữ trong 15 phút.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
