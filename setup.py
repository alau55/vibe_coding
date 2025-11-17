"""Setup script for Personal Knowledge Base CLI."""

from setuptools import setup, find_packages

with open("kb_README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="kb-cli",
    version="0.1.0",
    author="Knowledge Base CLI",
    description="A personal knowledge base CLI tool for managing notes",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/knowledge-base-cli",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Documentation",
    ],
    python_requires=">=3.7",
    install_requires=[
        # No external dependencies needed - using only stdlib
    ],
    entry_points={
        "console_scripts": [
            "kb=kb.cli:main",
        ],
    },
)
