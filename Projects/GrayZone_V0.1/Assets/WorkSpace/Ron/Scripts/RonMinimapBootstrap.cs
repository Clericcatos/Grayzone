using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public sealed class RonMinimapBootstrap : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void AttachUiManagerForTestScene()
    {
        if (SceneManager.GetActiveScene().name != "Test")
        {
            return;
        }

        if (FindFirstObjectByType<UIManager>() != null)
        {
            return;
        }

        Canvas canvas = FindFirstObjectByType<Canvas>();
        if (canvas == null)
        {
            canvas = CreateFallbackCanvas();
        }

        canvas.gameObject.AddComponent<UIManager>();
    }

    private static Canvas CreateFallbackCanvas()
    {
        GameObject canvasObject = new GameObject("Ron Fallback Canvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        Canvas canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;

        CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        return canvas;
    }
}
