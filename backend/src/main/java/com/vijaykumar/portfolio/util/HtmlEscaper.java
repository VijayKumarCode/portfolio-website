package com.vijaykumar.portfolio.util;

/**
 * HTML escape utility for email body generation.
 *
 * Prevents XSS in HTML emails by escaping special characters.
 * This is a simple, dependency-free implementation.
 */
public final class HtmlEscaper {

    private HtmlEscaper() {}

    public static String escape(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(input.length() * 2);
        for (char c : input.toCharArray()) {
            switch (c) {
                case '&'  -> sb.append("&amp;");
                case '<'  -> sb.append("&lt;");
                case '>'  -> sb.append("&gt;");
                case '"'  -> sb.append("&quot;");
                case \'\' -> sb.append("&#x27;");
                case '/'  -> sb.append("&#x2F;");
                default   -> sb.append(c);
            }
        }
        return sb.toString();
    }
}

