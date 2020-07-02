const { findUsersByIds } = require('../models/user-model');

const Enrollment = module.exports = {

  getEnrollmentsForEvent(eventId) {
    return global.client.query(`
        SELECT *
        FROM enrollments
        WHERE event_id = $1
    `, [eventId])
      .then(res => {
        console.log("RES", res.rows);
        return res.rows
      })
  },

  async getParticipantsCount(eventId) {
    const enrollments = await Enrollment.getEnrollmentsForEvent(eventId);
    console.log("ENROLLMENTS", enrollments);
    return enrollments.reduce((acc, curVal) => acc + curVal.guests, 0) + enrollments.length;
  },

  async addParticipants(event) {
    const enrollments = await Enrollment.getEnrollmentsForEvent(event.id);
    const userIds = enrollments.map(enrollment => enrollment.user_id);
    const enrollmentsUsers = await findUsersByIds(userIds);
    const allParticipants = enrollmentsUsers.map(user => ({
      username: user.username,
      guests: enrollments.find(({ user_id }) => user_id === user.id).guests
    }));

    event.participants = allParticipants;

    return event;
  },

  setGuestsForEnrollment(enrollment, guestCount) {
    console.log("-----ADDING GUESTS-----");

    return global.client.query(`
        UPDATE enrollments
        SET guests = $1
        WHERE user_id = $2
          AND event_id = $3
    `, [guestCount, enrollment.user_id, enrollment.event_id])
  },

  enrollUserForEvent(userId, event) {
    console.log("SIGNING UP FOR EVENT IN DB", userId, event);

    return global.client.query(`
        INSERT INTO enrollments (user_id, event_id)
        VALUES ($1, $2)
        RETURNING *
    `, [userId, event.id])
      .then(res => {
        return res.rows[0]
      })
  },

  removeUserFromEvent(userId, event) {
    console.log("Cancelling FOR EVENT IN DB", userId, event)
    return global.client.query(`
        DELETE
        FROM enrollments
        WHERE user_id = $1
          AND event_id = $2
    `, [userId, event.id]);
  },

};

