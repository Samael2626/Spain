from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:5187/"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in ((375, 812), (768, 1024), (1920, 1080)):
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.goto(URL, wait_until="domcontentloaded")
            page.locator(".hero-main-title").wait_for()
            page.screenshot(path=str(ROOT / f"audit-{width}.png"))
            if width in (375, 1920):
                for selector, name in (('.editorial-gallery', 'gallery'), ('.usecases-editorial-section', 'scenes')):
                    section = page.locator(selector)
                    section.scroll_into_view_if_needed()
                    section.locator('img').evaluate_all("images => Promise.all(images.map(image => image.decode().catch(() => null)))")
                    section.screenshot(path=str(ROOT / f"audit-{name}-{width}.png"))
                    if name == 'gallery':
                        page.locator('.gallery-detail-trigger').click()
                        detail = page.locator('#despiece')
                        detail.wait_for()
                        detail.screenshot(path=str(ROOT / f"audit-detail-{width}.png"))
                        detail.get_by_role('button', name='Cerrar despiece').click()
                        detail.wait_for(state='hidden')
            widths = page.evaluate("""() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })""")
            print(f"{width}px: viewport={widths['viewport']}, document={widths['document']}")
            if width == 375:
                page.get_by_role("button", name="VER OFERTAS", exact=True).click()
                page.get_by_role("dialog").wait_for()
                page.screenshot(path=str(ROOT / "audit-modal-375.png"))
                print("modal: visible; inputs=", page.get_by_role("dialog").locator("input").count())
            page.close()

        for width, height in ((375, 812), (1280, 800)):
            page = browser.new_page(viewport={"width": width, "height": height})
            page.clock.install()
            page.goto(URL, wait_until="domcontentloaded")
            page.clock.fast_forward(105000)
            promo = page.get_by_role('dialog', name='TU JIMKEG™.')
            promo.wait_for()
            promo.screenshot(path=str(ROOT / f'audit-promo-{width}.png'))
            promo.get_by_role('button', name='Seguir mirando').click()
            promo.wait_for(state='hidden')
            page.reload(wait_until='domcontentloaded')
            page.clock.fast_forward(105000)
            assert page.get_by_role('dialog', name='TU JIMKEG™.').count() == 0
            print(f'promo {width}px: shown after 105s; dismissed')
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
