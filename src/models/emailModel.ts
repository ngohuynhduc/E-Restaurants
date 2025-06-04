import nodemailer from 'nodemailer';
import { reservationMailTemplate } from '../utils/mailTemplate';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ucngohuynh@gmail.com',
    pass: 'bmqq fjff eeee tttr',
  },
});

export const sendReservationConfirmationEmail = async ({
  to,
  restaurantName,
  date,
  time,
  guestCount,
  full_name,
  phone,
  promotionData,
}: {
  to: string;
  restaurantName: string;
  date: string;
  time: string;
  guestCount: number;
  full_name: string;
  phone: string;
  promotionData: string;
}) => {
  const mailOptions = {
    from: 'ucngohuynh@gmail.com',
    to,
    subject: 'E-Restaurant Xác nhận đặt bàn thành công',
    html: reservationMailTemplate(restaurantName, date, time, guestCount, promotionData, full_name, phone),
  };

  await transporter.sendMail(mailOptions);
};
