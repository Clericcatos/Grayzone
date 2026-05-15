using UnityEngine;
using UnityEngine.InputSystem;

public class RonPlayerMover : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 12f;
    [SerializeField] private float mouseTurnSpeed = 0.18f;

    private void Update()
    {
        Keyboard keyboard = Keyboard.current;
        Mouse mouse = Mouse.current;
        if (keyboard == null)
        {
            return;
        }

        RotateWithMouse(mouse);
        MoveWithKeyboard(keyboard);
    }

    private void RotateWithMouse(Mouse mouse)
    {
        if (mouse == null || !mouse.rightButton.isPressed)
        {
            return;
        }

        float mouseX = mouse.delta.ReadValue().x;
        transform.Rotate(Vector3.up, mouseX * mouseTurnSpeed, Space.World);
    }

    private void MoveWithKeyboard(Keyboard keyboard)
    {
        float horizontal = 0f;
        float vertical = 0f;

        if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed) horizontal -= 1f;
        if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed) horizontal += 1f;
        if (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed) vertical -= 1f;
        if (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed) vertical += 1f;

        Vector3 input = new Vector3(horizontal, 0f, vertical);
        if (input.sqrMagnitude > 1f)
        {
            input.Normalize();
        }

        if (input.sqrMagnitude <= 0.0001f)
        {
            return;
        }

        Vector3 move = transform.right * input.x + transform.forward * input.z;
        transform.position += move * moveSpeed * Time.deltaTime;
    }
}
