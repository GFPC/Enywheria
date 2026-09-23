from setuptools import setup, find_packages

setup(
    name="enywheria",
    version="0.1.0",
    description="Personal Knowledge & Asset System (PersonalVault)",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "enywheria-relay=app.p2p.cli:run_relay",
            "enywheria-p2p=app.p2p.cli:run_node",
        ],
    },
    install_requires=[
        "cryptography>=42.0.5",
        "loguru>=0.7.2",
    ],
)
