import bluetooth
import pyautogui
import time
import numpy as np

pyautogui.FAILSAFE = False

# --- Настройки ---
SCALE = 40               # скорость мыши
SMOOTH = 0.25            # сглаживание
SHAKE_POWER = 4.5        # чувствительность встряхивания
HOLD_TIME = 0.8          # долгое удержание кнопки (сек)

# --- Внутренние переменные ---
prev_move = np.array([0.0, 0.0])
button_pressed_time = None

def smooth(current, prev, alpha):
    """Сглаживание"""
    return prev * (1 - alpha) + current * alpha


# --- Подключение к палочке ---
print("Ожидаю подключение Kano Wand...")

server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
server_sock.bind(("", 1))
server_sock.listen(1)

client_sock, addr = server_sock.accept()
print("Палочка подключена:", addr)


# --- Главный цикл ---
while True:
    try:
        data = client_sock.recv(1024).decode("utf-8").strip()

        # --------------------------
        #  ОБРАБОТКА КНОПКИ
        # --------------------------
        if data.startswith("BUTTON"):
            _, state = data.split(":")
            state = int(state)

            if state == 1:
                # кнопка нажата — запускаем таймер
                button_pressed_time = time.time()

            elif state == 0:
                # кнопка отпущена
                if button_pressed_time is not None:
                    hold = time.time() - button_pressed_time
                    button_pressed_time = None

                    # Долгое удержание → контекстное меню
                    if hold > HOLD_TIME:
                        print("Контекстное меню (правый клик)")
                        pyautogui.rightClick()

                    # Короткое нажатие → обычный клик
                    else:
                        print("Короткий клик")
                        pyautogui.click()

        # --------------------------
        #  ОБРАБОТКА ГИРОСКОПА
        # --------------------------
        elif data.startswith("GYRO"):
            _, gx, gy, gz = data.split(":")
            gx, gy, gz = float(gx), float(gy), float(gz)

            # преобразуем данные в движение мыши
            dx = gx * SCALE
            dy = -gy * SCALE

            current = np.array([dx, dy])
            smoothed = smooth(current, prev_move, SMOOTH)
            prev_move = smoothed

            # двигаем курсор
            pyautogui.moveRel(smoothed[0], smoothed[1])

        # --------------------------
        #  ОБРАБОТКА ВСТРЯХИВАНИЯ
        # --------------------------
        elif data.startswith("ACCEL"):
            _, ax, ay, az = data.split(":")
            ax, ay, az = float(ax), float(ay), float(az)

            power = abs(ax) + abs(ay) + abs(az)

            # встряхивание → клик
            if power > SHAKE_POWER:
                print("Встряхивание — клик мыши")
                pyautogui.click()

    except:
        continue
