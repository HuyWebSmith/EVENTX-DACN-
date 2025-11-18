// classes/TicketCart.js (Logic giỏ hàng)

class TicketItem {
  constructor(ticketId, eventId, name, price, quantity) {
    // ID trong JS sẽ là string ObjectId
    this.ticketId = ticketId.toString();
    this.eventId = eventId.toString();
    this.name = name;
    this.price = price;
    this.quantity = quantity;
  }
}

class TicketCart {
  constructor(items = []) {
    this.items = items;
  }

  addTicket(item) {
    const existingItem = this.items.find((i) => i.ticketId === item.ticketId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }
  }

  get total() {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  // ... các phương thức logic khác (removeTicket, updateQuantity)
}

module.exports = { TicketItem, TicketCart };
