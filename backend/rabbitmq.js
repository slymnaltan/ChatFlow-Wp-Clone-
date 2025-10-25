import amqp from 'amqplib';

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      
      console.log('✅ RabbitMQ bağlantısı başarılı');
      
      // Bağlantı koptuğunda yeniden bağlan
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ bağlantı hatası:', err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.log('⚠️ RabbitMQ bağlantısı kapandı');
        this.isConnected = false;
        this.reconnect();
      });

    } catch (error) {
      console.error('❌ RabbitMQ bağlantı hatası:', error);
      this.isConnected = false;
      // 5 saniye sonra tekrar dene
      setTimeout(() => this.connect(), 5000);
    }
  }

  async reconnect() {
    if (!this.isConnected) {
      console.log('🔄 RabbitMQ yeniden bağlanıyor...');
      setTimeout(() => this.connect(), 5000);
    }
  }

  async createQueue(queueName, options = {}) {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    const defaultOptions = {
      durable: true,
      ...options
    };

    await this.channel.assertQueue(queueName, defaultOptions);
    console.log(`📋 Kuyruk oluşturuldu: ${queueName}`);
  }

  async sendMessage(queueName, message, options = {}) {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const defaultOptions = {
      persistent: true,
      ...options
    };

    const sent = this.channel.sendToQueue(queueName, messageBuffer, defaultOptions);
    
    if (sent) {
      console.log(`📤 Mesaj gönderildi: ${queueName}`, message);
    } else {
      console.log(`⚠️ Mesaj gönderilemedi: ${queueName}`);
    }

    return sent;
  }

  async consumeMessages(queueName, callback, options = {}) {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    const defaultOptions = {
      noAck: false,
      ...options
    };

    await this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          console.log(`📥 Mesaj alındı: ${queueName}`, message);
          
          await callback(message, msg);
          
          // Mesajı onayla
          this.channel.ack(msg);
        } catch (error) {
          console.error('❌ Mesaj işleme hatası:', error);
          // Hatalı mesajı reddet
          this.channel.nack(msg, false, false);
        }
      }
    }, defaultOptions);

    console.log(`👂 Kuyruk dinleniyor: ${queueName}`);
  }

  async publishToExchange(exchangeName, routingKey, message, options = {}) {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const defaultOptions = {
      persistent: true,
      ...options
    };

    const sent = this.channel.publish(exchangeName, routingKey, messageBuffer, defaultOptions);
    
    if (sent) {
      console.log(`📢 Exchange'e mesaj gönderildi: ${exchangeName}/${routingKey}`, message);
    } else {
      console.log(`⚠️ Exchange'e mesaj gönderilemedi: ${exchangeName}/${routingKey}`);
    }

    return sent;
  }

  async createExchange(exchangeName, type = 'direct', options = {}) {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    const defaultOptions = {
      durable: true,
      ...options
    };

    await this.channel.assertExchange(exchangeName, type, defaultOptions);
    console.log(`📡 Exchange oluşturuldu: ${exchangeName} (${type})`);
  }

  async bindQueue(queueName, exchangeName, routingKey = '') {
    if (!this.isConnected) {
      throw new Error('RabbitMQ bağlantısı yok');
    }

    await this.channel.bindQueue(queueName, exchangeName, routingKey);
    console.log(`🔗 Kuyruk bağlandı: ${queueName} -> ${exchangeName}/${routingKey}`);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    console.log('🔌 RabbitMQ bağlantısı kapatıldı');
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Singleton instance
const rabbitmq = new RabbitMQ();

export default rabbitmq;


